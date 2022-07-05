<script lang="ts">
  export let className: string = '';
  export let text: string = '';
  export let onClick: Function = (evt) => {}
</script>

<div class="kai-button {className}" on:click={onClick}>
  <slot name="leftWidget"></slot>
  <span>{text}</span>
  <slot name="rightWidget"></slot>
</div>

<style>
  div.kai-button {
    font-size: 17px;
    height: 40px;
    border-radius: 2px;
    background: #ccc;
    text-align: center;
    color: #323232;
    border: 0;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    text-align: center;
    margin: 10px auto;
    padding: 0 5px;
    width: calc(100% - 15px);
    font-weight: 600;
  }

  div.kai-button.focus {
    outline: 0;
    color: #fff;
    background-color: var(--themeColor);
  }
</style>
