<script>
  import { onMount } from 'svelte';
  import { account } from '$lib/appwrite';
  import { createWorker } from 'tesseract.js';
  import { Configuration, OpenAIApi } from 'openai';

  let user = null;
  let receiptData = null;

  onMount(async () => {
    try {
      user = await account.get();
    } catch (error) {
      console.error(error);
    }
  });

  async function processReceipt(imageFile) {
    const worker = await createWorker('eng', 1, {
      logger: m => console.log(m),
    });

    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const { data: { text } } = await worker.recognize(imageFile);
    console.log(text);
    await worker.terminate();

    return parseReceiptText(text);
  }

  async function parseReceiptText(text) {
  const configuration = new Configuration({
    apiKey: '',
  });
  const openai = new OpenAIApi(configuration);

  const prompt = `
  Parse the following receipt text and return a structured JSON format with
  store name, address, telephone, items (with description, price, and currency), total (with currency),
  payment method, transaction ID, date and time, tax total.

  Receipt Text:
  """
  ${text}
  """

  Expected JSON structure:
  {
    "store_name": "Store Name",
    "store_address": "Store Address",
    "telephone": "Store Telephone",
    "date_time": "Date Time", // format: YYYY-MM-DD THH:MM:SS
    "items": [
      {
        "description": "Item Description",
        "price": Item Price,
        "currency": "Currency"
      }
    ],
    "total": {
      "amount": Total Amount,
      "currency": "Currency"
    },
    "payment_method": "Payment Method",
    "transaction_id": "Transaction ID",
    "tax_total": "Tax Total Amount"
  }
  `;

    try {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 1000
      });

      const jsonResponse = JSON.parse(response.data.choices[0].text.trim());
      return jsonResponse;
    } catch (error) {
      console.error("Error parsing receipt text:", error);
      return {
        error: "Failed to parse receipt text. Please check the input and try again."
      };
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const fileInput = event.target.querySelector('input[type="file"]');
    if (fileInput.files.length > 0) {
      const imageFile = fileInput.files[0];
      receiptData = await processReceipt(imageFile);
    }
  }
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
  <h1>Add a receipt!</h1>
  <form on:submit={handleSubmit}>
    <input type="file" accept="image/*" />
    <button type="submit">Submit</button>
  </form>

  {#if receiptData}
    <div>
      <h2>Receipt Data</h2>
      <p><strong>Date:</strong> {receiptData.date}</p>
      <p><strong>Store Name:</strong> {receiptData.storeName}</p>
      <h3>Items</h3>
      <ul>
        {#each receiptData.items as item}
          <li>{item.name}: ${item.price}</li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }

  h1 {
    width: 100%;
  }

  form {
    margin-bottom: 20px;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    margin: 5px 0;
  }
</style>
