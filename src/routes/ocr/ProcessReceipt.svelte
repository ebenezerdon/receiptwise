<script>
  import { onMount } from 'svelte';
  import { account } from '$lib/appwrite';
  import { createWorker } from 'tesseract.js';

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

  function parseReceiptText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let date = null;
    let storeName = null;
    const items = [];
    const datePattern = /\b\d{2}\/\d{2}\/\d{4}\b/;
    const pricePattern = /\b\d+\.\d{2}\b/;

    lines.forEach(line => {
      if (!date && datePattern.test(line)) {
        date = line.match(datePattern)[0];
      } else if (!storeName && /store|shop|mart|market|retail/i.test(line)) {
        storeName = line;
      } else if (pricePattern.test(line)) {
        const parts = line.split(pricePattern);
        const itemName = parts[0].trim();
        const itemPrice = line.match(pricePattern)[0];
        items.push({ name: itemName, price: itemPrice });
      }
    });

    return {
      date: date || "Date not found",
      storeName: storeName || "Store name not found",
      items: items.length > 0 ? items : "No items found"
    };
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
