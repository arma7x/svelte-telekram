<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../../utils/navigation';

  import MessageActionChannelCreate from "./action/MessageActionChannelCreate.svelte";
  import MessageActionChatEditPhoto from "./action/MessageActionChatEditPhoto.svelte";
  import Dummy from "./action/Dummy.svelte";

  export let key: any = '';
  export let entity: any = {};
  export let message: any = {};
  export let className: string = null;
  export let onClick: Function = (evt) => {}
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let destroyCallback: Function = () => {}
  export let replyTo: any;
  export let short: bool = false;

  let navOptions = {
    softkeyLeftListener: function(evt) {},
    softkeyRightListener: function(evt) {},
    enterListener: function(evt) {},
    backspaceListener: function(evt) {}
  };

  let navInstance = createKaiNavigator(navOptions);

  function resolveActionWidget(msg) {
    switch (msg.action.className) {
      case 'MessageActionChannelCreate':
        return MessageActionChannelCreate;
      case 'MessageActionChatEditPhoto':
        return MessageActionChatEditPhoto;
    }
    return Dummy;
  }

  onMount(() => {
    // console.log(message);
  });

</script>

<svelte:options accessors immutable={true}/>

<div data-key="{key}" class="kai-list-view {className ? className : ''}" on:click={onClick}>
  <div class="kai-list-view-content">
    <svelte:component this={resolveActionWidget(message)} {message} {parentNavInstance} {registerCallButtonHandler}/>
  </div>
</div>

<style>
  .kai-list-view {
    position: relative;
    background-color: transparent;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: start;
    box-sizing: border-box;
    width: 100%;
    font-size: 14px;
    overflow: hidden;
    padding: 4px;
  }

  .kai-list-view > .kai-list-view-content {
    border-radius: 5px;
    box-sizing: border-box;
    padding: 5px!important;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    max-width: calc(100% - 50px);
    overflow: hidden;
    border: 1px solid var(--themeColorTransparent);
  }

  .kai-list-view.focus,
  .kai-list-view.focus > .kai-list-view-content {
    background-color: var(--themeColorTransparent);
  }
</style>
