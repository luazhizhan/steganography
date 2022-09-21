# Steganography

## About the project

Steganography is the practice of concealing a message within another message or a physical object.

### Features

LSB Replacement algorithm is used to hide message/file into another file.

1. Hide message, `.png, .jpg, jpeg, .pdf, .docx, .pptx, .xlsx` to `.png` file
2. Hide message, `.png, .jpg, jpeg, .pdf, .docx, .pptx, .xlsx` to `.bmp` file

## Built With

- Next.js Typescript
- Python (API)

## Get Started

### Installation

- [Node.js v16](https://nodejs.org/en/)
- [Python 3.9 or higher](https://www.python.org/downloads/)

### Setting up

Install yarn package manager

```bash
npm install --global yarn
```

Install Vercel CLI globally

```bash
npm install --global vercel
```

Login to [Vercel](https://vercel.com/)

```bash
vercel
```

Install [pipenv](https://pipenv.pypa.io/en/latest/)

```bash
pip install pipenv
```

### Run the application

Please ensure you have completed tasks in Installation and Setting up sections before proceeding.

Run the following commands on your terminal.

```bash
yarn install # install required packages for the web

pipenv install # install required libraries for the APIs

yarn start # start application
```

Access http://localhost:3000/.

## Deployment

Vercel automatically deploy changes to production when the `main` branch is updated.

## APIs

The `api` folder is where all the Python APIs are in. Each file represent one API endpoint.

Learn more about [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
