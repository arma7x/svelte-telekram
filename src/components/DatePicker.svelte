<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../utils/navigation';
  import SoftwareKey from './SoftwareKey.svelte';

  export let title: string = 'Date Picker';
  export let date: Date = new Date();
  export let monthLocalization: string[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  export let softKeyLeftText: string = 'cancel';
  export let softKeyCenterText: string = 'Save';
  export let softKeyRightText: string = '';
  export let onEnter: Function = (evt, date: Date) => {};
  export let onBackspace: Function = (evt, date: Date) => {};
  export let onSoftkeyLeft: Function = (evt, date: Date) => {};
  export let onSoftkeyRight: Function = (evt, date: Date) => {};
  export let onOpened: Function = () => {};
  export let onClosed: Function = (date: Date) => {};

  const navClass = 'date-nav';
  let navClasses = [];
  let navClassIndex = -1;
  let softwareKey: SoftwareKey;

  export function setTitleText(text) {
    title = text;
  }

  function nav(next) {
    const currentIndex = navClassIndex;
    var move = navClassIndex + next;
    var cursor:any = navClasses[move];
    if (cursor != undefined) {
      navClassIndex = move;
    } else {
      if (move < 0) {
        move = navClasses.length - 1;
      } else if (move >= navClasses.length) {
        move = 0;
      }
      cursor = navClasses[move];
      navClassIndex = move;
    }
    cursor.classList.add('focus');
    if (navClasses[currentIndex]) {
      navClasses[currentIndex].classList.remove('focus');
    }
  }

  function setDay(move) {
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    if (date.getDate() === 1 && move === -1) {
      date.setDate(lastDayOfMonth.getDate() - 1);
      setDay(1);
      return;
    }
    if (date.getDate() === lastDayOfMonth.getDate() && move === 1) {
      date.setDate(1);
      setDay(0);
      return;
    }
    date.setDate(date.getDate() + move);
    const cursor = navClasses[1];
    cursor.previousElementSibling.textContent = formatInteger(date.getDate() - 1) || '';
    cursor.textContent = formatInteger(date.getDate());
    cursor.nextElementSibling.textContent= date.getDate() + 1 > lastDayOfMonth.getDate() ? '' : formatInteger(date.getDate() + 1);
  }

  function setMonth(move) {
    const thisDay = date.getDate();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    firstDayOfMonth.setMonth(firstDayOfMonth.getMonth() + move);
    const cursor = navClasses[0];
    cursor.previousElementSibling.textContent = monthLocalization[(firstDayOfMonth.getMonth() - 1 === -1 ? '' : firstDayOfMonth.getMonth() - 1)];
    cursor.textContent = monthLocalization[firstDayOfMonth.getMonth()];
    cursor.nextElementSibling.textContent= monthLocalization[(firstDayOfMonth.getMonth() + 1 === 12 ? '' : firstDayOfMonth.getMonth() + 1)];
    const lastDayOfMonth = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 0);
    if (thisDay > lastDayOfMonth.getDate()) {
      firstDayOfMonth.setDate(lastDayOfMonth.getDate());
    } else {
      firstDayOfMonth.setDate(thisDay);
    }
    firstDayOfMonth.setHours(date.getHours());
    firstDayOfMonth.setMinutes(date.getMinutes());
    firstDayOfMonth.setSeconds(date.getSeconds());
    date = firstDayOfMonth;
    setDay(0);
  }

  function setYear(move) {
    const year = date.getFullYear() + move;
    const isLeap = ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
    if (date.getDate() === 29 && date.getMonth() === 1 && !isLeap)
      date.setDate(date.getDate() - 1);
    date.setFullYear(year);
    const cursor = navClasses[2];
    cursor.previousElementSibling.textContent = date.getFullYear() - 1;
    cursor.textContent = date.getFullYear();
    cursor.nextElementSibling.textContent= date.getFullYear() + 1;
    setMonth(0);
  }

  function formatInteger(n: int): string {
    if (n > 0 && n < 10)
      return `0${n}`;
    return n;
  }

  let navOptions = {
    arrowUpListener: function(evt) {
      if (navClassIndex == 0) {
        setMonth(-1);
      } else if (navClassIndex == 1) {
        setDay(-1);
      } else if (navClassIndex == 2) {
        setYear(-1);
      }
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowDownListener: function(evt) {
      if (navClassIndex == 0) {
        setMonth(1);
      } else if (navClassIndex == 1) {
        setDay(1);
      } else if (navClassIndex == 2) {
        setYear(1);
      }
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowLeftListener: function(evt) {
      nav(-1);
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowRightListener: function(evt) {
      nav(1);
      evt.preventDefault();
      evt.stopPropagation();
    },
    softkeyLeftListener: function(evt) {
      if (onSoftkeyLeft == null)
        return;
      onSoftkeyLeft(evt, date);
    },
    softkeyRightListener: function(evt) {
      if (onSoftkeyRight == null)
        return;
      onSoftkeyRight(evt, date);
    },
    enterListener: function(evt) {
      if (onEnter == null)
        return;
      onEnter(evt, date);
    },
    backspaceListener: function(evt) {
      if (onBackspace == null)
        return;
      onBackspace(evt, date);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  onMount(() => {
    navInstance.attachListener();
    softwareKey = new SoftwareKey({
      target: document.body,
      props: {
        isInvert: false,
        leftText: softKeyLeftText,
        centerText: softKeyCenterText,
        rightText: softKeyRightText
      }
    });
    const doms = document.getElementsByClassName(navClass);
    const keys = Object.keys(doms);
    for (var k in keys) {
      navClasses.push(doms[k]);
    }
    nav(1);
    setYear(0);
    setMonth(0);
    setDay(0);
    onOpened();
  })

  onDestroy(() => {
    navInstance.detachListener();
    softwareKey.$destroy();
    onClosed(date);
  })

</script>

<svelte:options accessors/>

<div class="kai-dialog">
  <div class="kai-dialog-content">
    <div class="kai-dialog-header">{title}</div>
    <div class="kai-dialog-body">
      <div class="date-picker-row">
        <div class="date-column">
          <div class="date-block">-1M</div>
          <div class="{navClass} date-block navable">M</div>
          <div class="date-block">+1M</div>
        </div>
        <div class="date-line"></div>
        <div class="date-column">
          <div class="date-block">-1D</div>
          <div class="{navClass} date-block navable">D</div>
          <div class="date-block">+1D</div>
        </div>
        <div class="date-line"></div>
        <div class="date-column">
          <div class="date-block">-1Y</div>
          <div  class="{navClass} date-block navable">Y</div>
          <div class="date-block">+1Y</div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .kai-dialog {
    width: 100%;
    height: calc(100% - 30px);
    bottom: 30px;
    position: fixed;
    background-color: rgba(0, 0, 0, 0.6);
  }
  .kai-dialog > .kai-dialog-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: calc(100% - 84px);
    bottom: 30px;
    position: fixed;
    background-color: #ffffff;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-header {
    width: 100%;
    text-align: center;
    vertical-align: middle;
    line-height: 28px;
    height: 28px;
    padding: 0 4px;
    color: #313131;
    background-color: #cccccc;
    font-weight: 200;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body {
    padding: 5px 0px;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body > .date-picker-row {
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    align-items: stretch;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body > .date-picker-row > .date-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    text-align: center;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body > .date-picker-row > .date-line {
    width: 1px;
    background-color: #cacaca;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body > .date-picker-row > .date-column > .date-block {
    display:block;
    vertical-align: middle;
    text-align: center;
    padding: 10px 0;
    height: 38px;
    color: #323232;
    font-size: 15px;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body > .date-picker-row > .date-column > .date-block.navable {
    color: var(--themeColor);
    font-size: 17px;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body > .date-picker-row > .date-column > .date-block.navable.focus {
    color: #ffffff;
    background-color: var(--themeColor);
    font-weight: bold;
  }
</style>
