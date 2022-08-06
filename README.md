# Exa

**Exa** is a full stack web application project I made for online tests/exams. This is the backend code for the project written with Node.js, Express.js, and MongoDB.

The front-end code for this application, which was made using Svelte, can be found [here](https://github.com/4g3nt47/exa-backend)

## Installation

1. Clone the repo

```bash
git clone https://github.com/4g3nt47/exa-backend.git
cd exa-backend
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file

```bash
DB_URL=<DB_URL>
SECRET=<SOME_LONG_RANDOM_SECRET_STRING>
PORT=3000
ORIGIN_URL=<YOUR_FRONTEND_URL>
MAX_AVATAR_SIZE=500000
```

4. Start the API

```bash
node index.js
```
