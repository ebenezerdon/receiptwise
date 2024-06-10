<script lang="ts">
  import { onMount } from 'svelte'
  import { account, ID } from '$lib/appwrite'
  import { page } from '$app/stores'

  let email = ''

  let redirectURL: string;

  $: redirectURL = $page.url.href;

  let user = null
  let userIsLoggedIn = false
  let isNewUser = false

  const loginUser = async (e: Event) => {
    e.preventDefault()

    try {
      const token = await account.createMagicURLToken(ID.unique(), email.trim(), redirectURL)
      console.log(token)
    } catch (error) {
      console.error(error)
    }
  }

  const logoutUser = async () => {
    try {
      await account.deleteSession('current')
      userIsLoggedIn = false
    } catch (error) {
      console.error(error)
    }
  }

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const secret = urlParams.get('secret');
    const userId = urlParams.get('userId');

    try {
      console.log('account:', account);

      if (secret && userId) {
        console.log('userId ===>', userId)
        user = await account.createSession(secret, userId)
        console.log(user)
      } else {
        user = await account.get()
      }

      if (user?.$id) {
        userIsLoggedIn = true
      } else {
        userIsLoggedIn = false
      }

      console.log(user)
      console.log('Is new user:', isNewUser)

      console.log('Redirect URL:', redirectURL);

    } catch (error) {
      console.error(error)
    }
  })
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

{#if !userIsLoggedIn}
  <section>
    <h1>Login or Register</h1>
    <form on:submit={loginUser}>
      <input type="email" placeholder="Email" bind:value={email} />
      <button type="submit">Submit</button>
    </form>
  </section>
{/if}

{#if userIsLoggedIn}
  <section>
    <h1>You are logged in!</h1>
    <button on:click={logoutUser}>Logout</button>
  </section>
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
    width: 100%
  }
</style>
