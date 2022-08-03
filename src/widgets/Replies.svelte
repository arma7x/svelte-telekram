<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../utils/navigation';
  import SoftwareKey from '../components/SoftwareKey.svelte';
  import Message from './message/Message.svelte';

  const navClass: string = 'optionMenuNav';

  export let title: string = 'Option Menu';
  export let chat: any = {};
  export let messages: Array<any>;
  export let onBackspace: Function = (evt) => {};
  export let onOpened: Function = () => {};
  export let onClosed: Function = () => {};
  export let resolveMessageWidget: Function = (msg) => {};
  export let getReplyHeader: Function = (msg) => {};

  let softwareKey: SoftwareKey;

  let nodeRef;
  let registerCallButtonHandler: Function = (id, callback) => {}

  export function setTitleText(text) {
    title = text;
  }

  let navOptions = {
    arrowUpListener: function(evt) {
      nodeRef.scrollTop -= 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowDownListener: function(evt) {
      nodeRef.scrollTop += 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowLeftListener: function(evt) {
      nodeRef.scrollLeft -= 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowRightListener: function(evt) {
      nodeRef.scrollLeft += 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    softkeyLeftListener: function(evt) {},
    softkeyRightListener: function(evt) {
      onBackspace(evt);
    },
    backspaceListener: function(evt) {
      onBackspace(evt);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  onMount(() => {
    navInstance.attachListener();
    softwareKey = new SoftwareKey({
      target: document.body,
      props: {
        isInvert: true,
        leftText: '',
        centerText: '',
        rightText: 'Close'
      }
    });
    onOpened();
  })

  onDestroy(() => {
    navInstance.detachListener();
    softwareKey.$destroy();
    onClosed();
  })

</script>

<svelte:options accessors immutable={true}/>

<div class="kai-option-menu">
  <div class="kai-option-menu-content">
    <div class="kai-option-menu-header">{title}</div>
    <div bind:this={nodeRef} class="kai-option-menu-body" data-pad-top="66" data-pad-bottom="30">
      {#each messages as message}
        <svelte:component className="replies" this={resolveMessageWidget(message)} {message} {registerCallButtonHandler} parentNavInstance={navInstance} replyTo={getReplyHeader(message)} chat={chat} short={false} scrollable={false}/>
      {/each}
    </div>
  </div>
</div>

<style>
  .kai-option-menu {
    width: 100%;
    height: calc(100% - 30px);
    bottom: 30px;
    position: fixed;
    background-color: rgba(0, 0, 0, 0.6);
  }
  .kai-option-menu > .kai-option-menu-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: calc(100% - 56px);
    bottom: 30px;
    position: fixed;
    background-color: #ffffff;
  }
  .kai-option-menu > .kai-option-menu-content > .kai-option-menu-header {
    width: 100%;
    text-align: center;
    vertical-align: middle;
    line-height: 28px;
    height: 28px;
    padding: 0 4px;
    color: #313131;
    background-color: #cccccc;
    font-weight: normal;
    font-weight: 200;
  }
  .kai-option-menu > .kai-option-menu-content > .kai-option-menu-body {
    width: 100%;
    max-height: calc(100% - 68px);
    overflow: scroll;
  }
</style>
