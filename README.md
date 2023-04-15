<h1 align="center">Welcome to gpt4all-client 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.0.1-blue.svg?cacheSeconds=2592000" />
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> GPT4All Typescript Client

## Intro

This is a fork of _gpt4all-ts_ repository, which is a TypeScript implementation of the GPT4all language model. This fork is intended to add additional features and improvements to the original codebase.

## Install

```sh
yarn install
```

## Usage

```typescript
import { GPT4All } from "gpt4all-ts-client";

// Instantiate GPT4All with default or custom settings
const gpt4all = new GPT4All("gpt4all-lora-unfiltered-quantized"); // Default is 'gpt4all-lora-quantized' model

// Initialize and download missing files
const forceDownload = false;
await gpt4all.init(forceDownload);

// Open the connection with the model
await gpt4all.open();
// Generate a response using a prompt
const prompt = "Tell me about how Open Access to AI is going to help humanity.";
const response = await gpt4all.prompt(prompt);
console.log(`Prompt: ${prompt}`);
console.log(`Response: ${response}`);

// Close the connection when you're done
gpt4all.close();
```

## Example usage

```sh
yarn build
yarn dev
```

## Author

👤 **Huynh Duc Dung @jellydn**

- Website: https://productsway.com/
- Twitter: [@jellydn](https://twitter.com/jellydn)
- Github: [@jellydn](https://github.com/jellydn)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/jellydn/new-web-app/issues).

## Show your support

[![kofi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/dunghd)
[![paypal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/dunghd)
[![buymeacoffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/dunghd)

Give a ⭐️ if this project helped you!
