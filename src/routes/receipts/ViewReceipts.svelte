<script>
  import { onMount } from 'svelte';
  import { account, db } from '$lib/appwrite';

  let receipts = [];
  let uniqueStores = []

  onMount(async () => {
    try {
      await db.receipts.list()
        .then((data) => {
          receipts = data.documents || [];
          receipts.forEach((receipt) => {
            uniqueStores.push(receipt.store_name);
          });
          uniqueStores = Array.from(new Set(uniqueStores));
        });
      console.log('==receipts==>', receipts);
      console.log('==uniqueStores==>', Array.from(uniqueStores));
    } catch (error) {
      console.error(error);
    }
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
