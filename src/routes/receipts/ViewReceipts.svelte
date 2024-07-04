<script>
  import { onMount } from 'svelte';
  import { account, db } from '$lib/appwrite';
  import { onDestroy } from 'svelte';

  let receipts = [];
  let uniqueStores = [];
  let selectedReceipt = null;

  onMount(async () => {
    try {
      const { documents } = await db.receipts.list();
      receipts = documents || [];
    } catch (error) {
      console.error(error);
    }
  });

  $: uniqueStores = Array.from(new Set(receipts.map(receipt => receipt.store_name)));

  function showReceiptDetails(store_name) {
    selectedReceipt = receipts.find(receipt => receipt.store_name === store_name);
    document.addEventListener('keydown', handleKeydown);
  }

  function closeModal() {
    selectedReceipt = null;
    document.removeEventListener('keydown', handleKeydown);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  function handleOutsideClick(event) {
    if (event.target.classList.contains('modal')) {
      closeModal();
    }
  }

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
  });
</script>

<svelte:head>
  <title>Receipts</title>
  <meta name="description" content="View your shopping receipts" />
</svelte:head>

<section>
  <h1>View Your Receipts</h1>
  <ul>
    {#each uniqueStores as store_name}
      <li>
        <button on:click={() => showReceiptDetails(store_name)}>{store_name}</button>
      </li>
    {/each}
  </ul>
</section>

{#if selectedReceipt}
  <div class="modal" on:click={handleOutsideClick}>
    <div class="modal-content">
      <span class="close" on:click={closeModal}>&times;</span>
      <h2>{selectedReceipt.store_name}</h2>
      <p><strong>Address:</strong> {selectedReceipt.store_address}</p>
      <p><strong>Telephone:</strong> {selectedReceipt.telephone}</p>
      <p><strong>Date and Time:</strong> {selectedReceipt.date_time}</p>
      <ul>
        {#each selectedReceipt.items as item}
          <li>
            {item.description} - {item.price} {item.currency}
          </li>
        {/each}
      </ul>
      <p><strong>Total Amount:</strong> {selectedReceipt.total_amount} {selectedReceipt.currency}</p>
      <p><strong>Payment Method:</strong> {selectedReceipt.payment_method}</p>
      <p><strong>Transaction ID:</strong> {selectedReceipt.transaction_id}</p>
      <p><strong>Tax Total:</strong> {selectedReceipt.tax_total}</p>
    </div>
  </div>
{/if}

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

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    margin: 0.5em;
  }

  button {
    background: none;
    border: none;
    color: blue;
    cursor: pointer;
    text-decoration: underline;
  }

  .modal {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
  }

  .modal-content {
    background-color: #fefefe;
    margin: auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 600px;
  }

  .close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
  }

  .close:hover,
  .close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
  }
</style>
