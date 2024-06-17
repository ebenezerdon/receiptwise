<script>
  import { onMount } from 'svelte';
  import { account } from '$lib/appwrite';
  import { createWorker } from 'tesseract.js';

  let user = null;
  let receiptData = null;

  onMount(async () => {
    try {
      user = await account.get()
    } catch (error) {
      console.error(error)
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

    return await parseReceiptText(text);
  }

async function parseReceiptText(text) {
  const prompt = `
    Parse the following receipt text and return a structured JSON format with
    store name, address, telephone, items (with description, price, and currency), total (with currency),
    payment method, transaction ID, date and time, tax total (with currency).

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
      "tax_total": {
        "amount": Tax Total Amount,
        "currency": "Currency"
      },
    }
    `

  try {
    console.log('Sending receipt text to API===>');
    const response = await fetch('https://66701b5157fa3795549c.appwrite.global/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('=====<data>====', data);

    if (data.ok) {
      const jsonResponse = JSON.parse(data.completion);
      console.log('======>', jsonResponse);
      return jsonResponse;
    } else {
      console.log('======>', data.error);
      throw new Error(`API error: ${data.error}`);
    }
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
    <h2>Receipt Data</h2>
    <ul>
      {#if receiptData.error}
        <li>{receiptData.error}</li>
      {:else}
        <li>Store Name: {receiptData.store_name}</li>
        <li>Store Address: {receiptData.store_address}</li>
        <li>Telephone: {receiptData.telephone}</li>
        <li>Date Time: {receiptData.date_time}</li>
        <li>
          Items:
          <ul>
            {#each receiptData.items as item}
              <li>{item.description} - {item.price} {item.currency}</li>
            {/each}
          </ul>
        </li>
        <li>Total: {receiptData.total.amount} {receiptData.total.currency}</li>
        <li>Payment Method: {receiptData.payment_method}</li>
        <li>Transaction ID: {receiptData.transaction_id}</li>
        <li>Tax Total: {receiptData.tax_total.amount} {receiptData.tax_total.currency}</li>
      {/if}
    </ul>
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
