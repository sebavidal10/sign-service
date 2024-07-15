# Usar la imagen base oficial de Node.js
FROM node:14

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Instalar dependencias del sistema necesarias para construir módulos nativos
RUN apt-get update && apt-get install -y \
    python \
    g++ \
    make \
    libudev-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copiar los archivos de package.json y package-lock.json
COPY package*.json ./

# Instalar las dependencias del proyecto
RUN npm install

# Copiar el código de la aplicación
COPY . .

# Recompilar pkcs11js para asegurar compatibilidad
RUN npm rebuild pkcs11js

# Comando para ejecutar la aplicación
CMD ["node", "index.js"]
