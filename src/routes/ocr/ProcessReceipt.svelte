<script>
  import { onMount } from 'svelte';
  import { account } from '$lib/appwrite';
  import { createWorker } from 'tesseract.js';

  let user = null;
  let receiptData = null;
  let editedReceiptData = null;

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

    const { data: { text } } = await worker.recognize(imageFile);
    console.log(text);
    await worker.terminate();

    return await parseReceiptText(text);
  }

  async function parseReceiptText(text) {
    const prompt = `
      Parse the following receipt text and return a structured JSON format with
      store name, address, telephone, items (with description, price, and currency), total (with currency),
      payment method, transaction ID, date and time, tax total (with currency). Fix all grammar and spelling mistakes.

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
    `;

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
      editedReceiptData = JSON.parse(JSON.stringify(receiptData)); // Make a copy for editing
    }
  }

  function handleInputChange(event, index, field) {
    editedReceiptData.items[index][field] = event.target.value;
  }

  async function handleSave(event) {
    event.preventDefault();
    // Save the editedReceiptData to the database
    console.log('Saving edited receipt data to database:', editedReceiptData);
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
    <h2>Edit Receipt Data</h2>
    <form on:submit={handleSave}>
      <div class="form-group">
        <label>Store Name:</label>
        <input type="text" bind:value={editedReceiptData.store_name} />
      </div>
      <div class="form-group">
        <label>Store Address:</label>
        <input type="text" bind:value={editedReceiptData.store_address} />
      </div>
      <div class="form-group">
        <label>Telephone:</label>
        <input type="text" bind:value={editedReceiptData.telephone} />
      </div>
      <div class="form-group">
        <label>Date Time:</label>
        <input type="text" bind:value={editedReceiptData.date_time} />
      </div>
      <div class="form-group">
        <label>Items:</label>
        {#each editedReceiptData.items as item, index}
          <div class="item-group">
            <label>Description:</label>
            <input type="text" value={item.description} on:input={event => handleInputChange(event, index, 'description')} />
            <label>Price:</label>
            <input type="number" value={item.price} on:input={event => handleInputChange(event, index, 'price')} />
          </div>
        {/each}
      </div>
      <div class="form-group">
        <label>Total Amount:</label>
        <input type="number" bind:value={editedReceiptData.total.amount} />
        <label>Currency:</label>
        <input type="text" bind:value={editedReceiptData.total.currency} />
      </div>
      <div class="form-group">
        <label>Payment Method:</label>
        <input type="text" bind:value={editedReceiptData.payment_method} />
      </div>
      <div class="form-group">
        <label>Transaction ID:</label>
        <input type="text" bind:value={editedReceiptData.transaction_id} />
      </div>
      <div class="form-group">
        <label>Tax Total Amount:</label>
        <input type="number" bind:value={editedReceiptData.tax_total.amount} />
        <label>Currency:</label>
        <input type="text" bind:value={editedReceiptData.tax_total.currency} />
      </div>
      <button type="submit">Save</button>
    </form>
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
    width: 100%;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .item-group {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }

  .item-group label {
    margin-right: 10px;
  }

  input {
    padding: 5px;
    margin-right: 10px;
    width: 100%;
  }

  button {
    margin-top: 20px;
    padding: 10px 20px;
  }

  label {
    display: block;
    margin-top: 10px;
  }
</style>
