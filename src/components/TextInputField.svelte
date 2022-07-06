<script lang="ts">
  export let className: string = '';
  export let label: string = undefined;
  export let value: string = '';
  export let type: string = 'text';
  export let placeholder: string = '';
  export let onInput: Function = (evt) => {}
  export let onFocus: Function = (evt) => {}
  export let onBlur: Function = (evt) => {}
</script>

<div class="kai-text-input {className}">
  {#if label}
  <label for={label.split(' ').join('-')}>{label}</label>
  {/if}
  <input id={label && label.split(' ').join('-')} name={label} type={type} value={value} placeholder={placeholder} on:input={onInput} on:focus={onFocus} on:blur={onBlur}/>
</div>

<style>
  .kai-text-input {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: start;
    width: 100%;
    padding: 8px;
  }

  .kai-text-input > input {
    padding: 0 5px;
    margin: 0;
    width: 100%;
    height: 40px;
  }

  .kai-text-input > label {
    font-size: 14px;
  }

  .kai-text-input.focus {
    background-color: var(--themeColor);
  }

  .kai-text-input.focus > label {
    color: #ffffff;
  }
</style>
