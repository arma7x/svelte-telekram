<script lang="ts">

  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  import { Api, client } from '../../../utils/bootstrap';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let refetchMessage: Function = (id: number) => {}

  let username: bool|string = false;

  onMount(() => {
    client.invoke(new Api.users.GetUsers({ id: [message.action.userId] }))
    .then(users => {
      if (users.length > 0) {
        let u = '';
        if (users[0].firstName)
          u = users[0].firstName;
        if (users[0].lastName)
          u += ' ' + users[0].lastName;
        if (u == '' && users[0].username)
          u = users[0].username;
        u = u == '' ? false : u;
        username = u;
      }
    })
    .catch(err => {
      console.log("MessageActionChatDeleteUser:", err);
    });
  });

</script>

<svelte:options accessors immutable={true}/>

<div class="MessageActionChatDeleteUser">
  <p>User deleted{#if username}, {username}{/if}</p>
</div>

<style>
  .MessageActionChatDeleteUser {
    box-sizing: border-box;
    margin: 0px;
    padding: 0px;
  }
  .MessageActionChatDeleteUser > p {
    margin: 0px;
    padding: 0px;
    font-style: italic;
  }
</style>
