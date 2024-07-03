<script>
  import { onMount } from 'svelte';
  import { account, db } from '$lib/appwrite';

  let receipts = [];
  let uniqueStores = [];

  onMount(async () => {
    try {
      const { documents } = await db.receipts.list();
      receipts = documents || [];
    } catch (error) {
      console.error(error);
    }
  });

  $: {
    uniqueStores = Array.from(new Set(receipts.map(receipt => receipt.store_name)));
  }
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
        <a href={`/receipts/store/${encodeURIComponent(store_name)}`}>{store_name}</a>
      </li>
    {/each}
  </ul>
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

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    margin: 0.5em;
  }
</style>
