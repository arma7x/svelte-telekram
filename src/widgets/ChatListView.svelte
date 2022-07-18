<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let key:any = '';
  export let icon: string = '';
  export let chat: any = {};
  export let className: string = null;
  export let onClick: Function = (evt) => {}

  onMount(() => {
    // console.log(chat);
  });

</script>

<div data-key="{key}" class="kai-list-view {className ? className : ''}" on:click={onClick}>
  <div class="kai-list-view-icon">{@html icon}</div>
  <div class="kai-list-view-content">
    <p>
      {chat.name}
    </p>
    <small>
      {#if chat.isGroup}<b>{chat.message._sender.username || chat.message._sender.firstName}</b>:
      {/if}
      {#if chat.message && chat.message.message}
      {chat.message.message.substring(0, (chat.isGroup ? 15 : 30)) + (chat.message.message.length > (chat.isGroup ? 15 : 30) ? '...' : '')}
      {:else if chat.message.action}
      {chat.message.action.className}
      {:else}
      {chat.message.media ? chat.message.media.className : chat.message.className}
      {/if}
    </small>
  </div>
  <div class="kai-list-view-indicator">
    {#if chat.unreadCount}
      <span class="badge">{chat.unreadCount}</span>
    {/if}
    <span class="kai-icon-arrow"></span>
  </div>
</div>

<style>
  .kai-list-view {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    box-sizing: border-box;
    padding: 0px 8px;
    height: 60px;
    width: 100%;
    font-size: 14px;
  }

  .kai-list-view > .kai-list-view-icon {
    width: 40px;
    height: 40px;
    margin-right: 2px;
  }

  .kai-list-view > .kai-list-view-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: start;
    padding: 0px 4px 0px 0px;
    width: 100%;
  }

  .kai-list-view > .kai-list-view-content > p {
    padding: 0px;
    margin: 0px;
    font-weight: 400;
    color: #323232;
    font-size: 14px;
    text-align: start;
    height: 20px;
    width: 100%;
    white-space: pre-wrap!important;
    word-break: break-word!important;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
  }

  .kai-list-view > .kai-list-view-content > small {
    padding: 0px;
    font-size: 12px;
    color: #6A6A6A;
    text-align: start;
    vertical-align: middle;
  }

  .kai-list-view > .kai-list-view-indicator {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  .kai-list-view > .kai-list-view-indicator > .badge {
    color: #fff;
    background-color: #c0c0c0;
    font-weight: bold;
    border-radius: 5px;
    padding: 3px 3px 0 3px;
  }

  .kai-list-view.focus,
  .kai-list-view.focus > .kai-list-view-content > p,
  .kai-list-view.focus > .kai-list-view-content > small {
    background-color: var(--themeColor);
    color: #ffffff;
  }
</style>
