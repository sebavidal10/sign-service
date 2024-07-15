const express = require('express');
const bodyParser = require('body-parser');
const WebCrypto = require('node-webcrypto-p11');
const { MongoClient, ObjectId } = require('mongodb');
const atob = require('atob');

const config = {
  library: '/usr/lib/softhsm/libsofthsm2.so',
  name: 'SoftHSMv2',
  slot: 0,
  readWrite: true,
  pin: '1234',
};

const crypto = new WebCrypto(config);
const app = express();
app.use(bodyParser.json({ limit: '50mb' }));

const uri = 'mongodb://mongodb:27017';
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

client.connect((err) => {
  if (err) throw err;
  db = client.db('signingDB');
  console.log('Connected to MongoDB');
});

async function generateAndStoreKeyPair(run, userInfo) {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: { name: 'SHA-256' },
    },
    true,
    ['sign', 'verify']
  );

  const privateKeyJwk = await crypto.subtle.exportKey(
    'jwk',
    keyPair.privateKey
  );
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

  const fingerprint = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(publicKeyJwk))
  );

  const certificate = {
    run,
    userInfo,
    publicKey: publicKeyJwk,
    fingerprint: Buffer.from(fingerprint).toString('hex'),
    issuedAt: new Date(),
  };

  const result = await db.collection('certificates').insertOne(certificate);

  await db.collection('keys').insertOne({
    _id: result.insertedId,
    privateKey: privateKeyJwk,
  });

  return result.insertedId;
}

async function getPrivateKeyByRun(run) {
  const certificate = await db.collection('certificates').findOne({ run });
  if (!certificate) throw new Error('Certificate not found');
  const key = await db.collection('keys').findOne({ _id: certificate._id });
  if (!key) throw new Error('Key not found');
  return key.privateKey;
}

app.post('/register', async (req, res) => {
  const { run, userInfo } = req.body;

  if (!run || !userInfo) {
    return res.status(400).json({ error: 'RUN and user info are required' });
  }

  try {
    const certificateId = await generateAndStoreKeyPair(run, userInfo);
    res.json({ certificateId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/sign', async (req, res) => {
  const { documentBase64, run } = req.body;

  if (!documentBase64 || !run) {
    return res.status(400).json({ error: 'Document and RUN are required' });
  }

  try {
    const documentBuffer = Buffer.from(documentBase64, 'base64');
    const privateKeyJwk = await getPrivateKeyByRun(run);
    const privateKey = await crypto.subtle.importKey(
      'jwk',
      privateKeyJwk,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: 'SHA-256' },
      },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      {
        name: 'RSASSA-PKCS1-v1_5',
      },
      privateKey,
      documentBuffer
    );

    const signatureHex = Buffer.from(signature).toString('hex');

    res.json({ documentBase64, signature: signatureHex });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
