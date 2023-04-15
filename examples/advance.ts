import { GPT4All } from "../src/gpt4all.js";

const main = async () => {
  // Instantiate GPT4All with default or custom settings
  const gpt4all = new GPT4All("gpt4all-lora-unfiltered-quantized"); // Default is 'gpt4all-lora-quantized' model

  // Initialize and download missing files
  const forceDownload = false;
  await gpt4all.init(forceDownload);

  // Open the connection with the model
  await gpt4all.open();
  // Generate a response using a prompt
  const prompt = "How to implement buble sort with Javascript";
  const response = await gpt4all.prompt(prompt);
  console.log(`Prompt: ${prompt}`);
  console.log(`Response: ${response}`);

  const prompt2 = "Rewrite above code in C++ and explain how it works";

  const response2 = await gpt4all.prompt(prompt2);
  console.log(`Prompt: ${prompt2}`);
  console.log(`Response: ${response2}`);

  // Close the connection when you're done
  gpt4all.close();
};

main().catch(console.error);
