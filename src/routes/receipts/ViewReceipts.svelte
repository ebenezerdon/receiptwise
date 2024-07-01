<script>
  import { onMount } from 'svelte';
  import { account, db } from '$lib/appwrite';

  let receipts = [];

  onMount(async () => {
    try {
      await db.receipts.list()
        .then((data) => {
          receipts = data.documents || [];
        });
      console.log('====>', receipts);
    } catch (error) {
      console.error(error);
    }
  })
</script>

<svelte:head>
  <title>Receipts</title>
  <meta name="description" content="View your shopping receipts" />
</svelte:head>

<section>
  <h1>View Your Receipts</h1>
  <ul>
    {#each receipts as receipt}
      <li>
        <a href="/receipts/{receipt.$id}">{receipt.store_name}</a>
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
