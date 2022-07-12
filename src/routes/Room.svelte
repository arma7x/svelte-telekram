<script lang="ts">
  import { navigate as goto } from "svelte-navigator";
  import { createKaiNavigator } from '../utils/navigation';
  import { onMount, onDestroy } from 'svelte';

  import { Api, client } from '../utils/mtproto_client';

  export let location: any;
  export let navigate: any;
  export let getAppProp: Function;

  let name: string = 'Room';

  let navOptions = {
    verticalNavClass: 'vertClass',
    softkeyLeftListener: function(evt) {},
    softkeyRightListener: function(evt) {},
    enterListener: function(evt) {},
    backspaceListener: function(evt) {
      evt.preventDefault();
      goto(-1);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  async function getMessages(entity) {
    const parsed = new telegram.Api[entity.className](entity);
    // console.log(entity);
    // console.log(parsed);
    return
    try {
      await client.invoke(parsed);
      const messages = await client.getMessages(parsed, { limit: 50 });
      console.log(messages);
    } catch (err) {
      console.log(err);
    }
  }

  onMount(() => {
    const { appBar, softwareKey } = getAppProp();
    appBar.setTitleText(location.state.name || name);
    getMessages(location.state.entity);
    softwareKey.setText({ left: 'Menu', center: 'SEND', right: 'Attach' });
    navInstance.attachListener();
  });

  onDestroy(() => {
    navInstance.detachListener();
  });

</script>

<main id="room-screen" data-pad-top="28" data-pad-bottom="30">
  <div class="vertClass">Vertical 1</div>
  <div class="vertClass">Vertical 2</div>
</main>

<style>
  #room-screen {
    overflow: scroll;
    width: 100%;
  }
  #room-screen > .vertical {
    display:flex;
    flex-direction:column;
  }
  #room-screen > .horizontal {
    width:100%;
    display:flex;
    flex-direction:row;
  }
  :global(#room-screen > .vertClass) {
    background-color: #ffffff;
    color: #000000;
  }
  :global(#room-screen > .vertClass.focus) {
    background-color: var(--themeColor)!important;
    color: #fff!important;
  }
</style>
