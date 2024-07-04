<script>
  import { onMount } from 'svelte';
  import { account, db, storage, ID } from '$lib/appwrite';
  import { createWorker } from 'tesseract.js';

  let user = null;
  let receiptData = null;
  let editedReceiptData = null;
  let isProcessing = false;
  let isParsing = false;
  let imageFile = null;

  onMount(async () => {
    try {
      user = await account.get();
    } catch (error) {
      console.error(error);
    }
  });

  async function processReceipt(imageFile) {
    isProcessing = true;
    const worker = await createWorker('eng', 1);

    const { data: { text } } = await worker.recognize(imageFile);
    console.log(text);
    await worker.terminate();
    isProcessing = false;

    return await parseReceiptText(text);
  }

  async function parseReceiptText(text) {
    isParsing = true;
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
            "price": Item Price as Float,
            "currency": "Currency"
          }
        ],
        "total_amount": Total Amount as Float,
        "currency": "Currency",
        "payment_method": "Payment Method",
        "transaction_id": "Transaction ID",
        "tax_total": Tax Total Amount as Float,
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
    } finally {
      isParsing = false;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const fileInput = event.target.querySelector('input[type="file"]');
    if (fileInput.files.length > 0) {
      imageFile = fileInput.files[0];
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
    await db.receipts.create({
      user_id: user.$id,
      store_name: editedReceiptData.store_name,
      store_address: editedReceiptData.store_address,
      telephone: editedReceiptData.telephone,
      date_time: editedReceiptData.date_time,
      items: editedReceiptData.items,
      total_amount: editedReceiptData.total_amount,
      payment_method: editedReceiptData.payment_method,
      transaction_id: editedReceiptData.transaction_id,
      tax_total: editedReceiptData.tax_total,
      currency: editedReceiptData.currency
    }).then(response => {
      console.log('Receipt saved:', response)

      const promise = storage.createFile(
        '6686b035001d4abfd251',
        ID.unique(),
        imageFile
    )

    promise.then(function (response) {
        console.log(response); // Success
    }, function (error) {
        console.log(error); // Failure
    })

    }).catch(error => {
      console.error('Error saving receipt:', error)
    })
  }
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Process your shopping receipts" />
</svelte:head>

<section>
  <h1>Add a receipt!</h1>
  <form on:submit={handleSubmit}>
    <input type="file" accept="image/*" />
    <button type="submit">Submit</button>
  </form>

  {#if isProcessing}
    <p>Whipping up the pixels...</p>
  {/if}

  {#if isParsing}
    <p>Magic in progress...</p>
  {/if}

  {#if receiptData && !isProcessing && !isParsing}
    <h2>Edit Receipt Data</h2>
    <form on:submit={handleSave}>
      <div class="form-group">
        <label for="storeName">Store Name:</label>
        <input type="text" bind:value={editedReceiptData.store_name} id="storeName" />
      </div>
      <div class="form-group">
        <label for="storeAddress">Store Address:</label>
        <input type="text" bind:value={editedReceiptData.store_address} id="storeAddress" />
      </div>
      <div class="form-group">
        <label for="telephone">Telephone:</label>
        <input type="text" bind:value={editedReceiptData.telephone} id="telephone" />
      </div>
      <div class="form-group">
        <label for="dateTime">Date Time:</label>
        <input type="text" bind:value={editedReceiptData.date_time} id="dateTime" />
      </div>
      <div class="form-group">
        <label for='items'>Items:</label>
        {#each editedReceiptData.items as item, index}
            <div class="item-group">
            <label for="description">Description:</label>
            <input type="text" value={item.description} on:input={event => handleInputChange(event, index, 'description')} id="description" />
            <label for="price">Price:</label>
            <input type="number" step="any" value={item.price} on:input={event => handleInputChange(event, index, 'price')} id="price" />
          </div>
        {/each}
      </div>
      <div class="form-group">
        <label for="totalAmount">Total Amount:</label>
        <input type="number" step="any" bind:value={editedReceiptData.total_amount} id="totalAmount" />
        <label for="currency">Currency:</label>
        <input type="text" bind:value={editedReceiptData.currency} id="currency" />
      </div>
      <div class="form-group">
        <label for="paymentMethod">Payment Method:</label>
        <input type="text" bind:value={editedReceiptData.payment_method} id="paymentMethod" />
      </div>
      <div class="form-group">
        <label for="transactionId">Transaction ID:</label>
        <input type="text" bind:value={editedReceiptData.transaction_id} id="transactionId" />
      </div>
      <div class="form-group">
        <label for="taxTotalAmount">Tax Total Amount:</label>
        <input type="number" step="any" bind:value={editedReceiptData.tax_total} id="taxTotalAmount" />
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

  p {
    font-size: 1.2em;
    color: #555;
  }
</style>
