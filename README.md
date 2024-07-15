# Sign Service

Sign Service es un sistema para la firma electrónica avanzada de documentos utilizando SoftHSM, Node.js, Express y MongoDB.

## Tabla de Contenidos

- [Sign Service](#sign-service)
  - [Tabla de Contenidos](#tabla-de-contenidos)
  - [Instalación](#instalación)
    - [Requisitos](#requisitos)
    - [Pasos de Instalación](#pasos-de-instalación)
  - [Configuración](#configuración)
  - [Uso](#uso)
    - [Registro de Usuario](#registro-de-usuario)
      - [Ejemplo de Solicitud](#ejemplo-de-solicitud)
      - [Ejemplo de Respuesta](#ejemplo-de-respuesta)
    - [Firma de Documentos](#firma-de-documentos)
      - [Conversión de Documento PDF a Base64](#conversión-de-documento-pdf-a-base64)
      - [Ejemplo de Solicitud](#ejemplo-de-solicitud-1)
      - [Ejemplo de Respuesta](#ejemplo-de-respuesta-1)
  - [Estructura del Proyecto](#estructura-del-proyecto)

## Instalación

### Requisitos

- Docker
- Docker Compose

### Pasos de Instalación

1. Clona el repositorio:

   ```sh
   git clone https://github.com/sebavidal10/sign-service.git
   cd sign-service
   ```

2. Elimina las dependencias locales:

   ```sh
   rm -rf node_modules package-lock.json
   ```

3. Construye las imágenes Docker:

   ```sh
   docker-compose build
   ```

4. Levanta los contenedores:

   ```sh
   docker-compose up -d
   ```

## Configuración

El archivo `docker-compose.yml` incluye la configuración de los servicios necesarios:

- SoftHSM
- MongoDB
- Servicio de firma (`sign-service`)

## Uso

### Registro de Usuario

Para registrar un usuario, envía una solicitud POST al endpoint `/register` con el RUN y la información del usuario.

#### Ejemplo de Solicitud

```sh
curl -X POST http://localhost:3000/register \
-H "Content-Type: application/json" \
-d '{
  "run": "15989091",
  "userInfo": {
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}'
```

#### Ejemplo de Respuesta

```json
{
  "certificateId": "60d5f2d72f8fb814c8a65d93"
}
```

### Firma de Documentos

Para firmar un documento, convierte el archivo PDF a base64 y envía una solicitud POST al endpoint `/sign` con el documento en base64 y el RUN del usuario registrado.

#### Conversión de Documento PDF a Base64

```sh
base64 -i document.pdf > document_base64.txt
```

#### Ejemplo de Solicitud

```sh
document_base64=$(cat document_base64.txt)

curl -X POST http://localhost:3000/sign \
-H "Content-Type: application/json" \
-d '{
  "documentBase64": "'"$document_base64"'",
  "run": "15989091"
}'
```

#### Ejemplo de Respuesta

```json
{
  "documentBase64": "JVBERi0xLjQKJcTl8uXrp...",
  "signature": "3046022100e4f...a6f"
}
```

## Estructura del Proyecto

```
sign-service/
├── Dockerfile
├── docker-compose.yml
├── index.js
├── package.json
└── package-lock.json
```

- `Dockerfile`: Define la configuración de la imagen Docker para el servicio de firma.
- `docker-compose.yml`: Configura y orquesta los servicios necesarios para el sistema.
- `index.js`: Contiene la lógica del servidor y los endpoints de la API.
- `package.json` y `package-lock.json`: Definen las dependencias del proyecto.
