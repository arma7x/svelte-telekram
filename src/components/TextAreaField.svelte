<script lang="ts">
  export let className: string = '';
  export let label: string = undefined;
  export let value: string = '';
  export let type: string = 'text';
  export let placeholder: string = '';
  export let rows:number = 2;
  export let onInput: Function = (evt) => {}
  export let onFocus: Function = (evt) => {}
  export let onBlur: Function = (evt) => {}
</script>

<div class="kai-text-area {className}">
  {#if label}
  <label for={label.split(' ').join('-')}>{label}</label>
  {/if}
  <textarea id={label && label.split(' ').join('-')} name={label} type={type} value={value} placeholder={placeholder} rows={rows} on:input={onInput} on:focus={onFocus} on:blur={onBlur}></textarea>
</div>

<style>
  .kai-text-area {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: start;
    width: 100%;
    padding: 8px;
  }

  .kai-text-area > textarea {
    padding: 5px;
    margin: 0;
    width: 100%;
  }

  .kai-text-area > label {
    font-size: 14px;
  }

  .kai-text-area.focus {
    background-color: var(--themeColor);
  }

  .kai-text-area.focus > label {
    color: #ffffff;
  }
</style>
