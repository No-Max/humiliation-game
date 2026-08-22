<script setup lang="ts">
import Button from '../components/Button.vue';
</script>

<template>
  <div>
    <h1 class="page-title">Добро пожаловать!</h1>
    <div class="card">
      <p style="margin-bottom: 16px">
        Собирайтесь с друзьями, запускайте нашу игру, улыбайтесь и получайте удовольствие от ваших знаний.
      </p>
      <Button to="/series">Выбрать выпуск</Button>
    </div>

    <div class="card">
      <h2 style="margin-bottom: 16px">Как начать играть</h2>
      <div class="steps">
        <div class="step">
          <span class="step-num">1</span>
          <div>
            <strong>Создайте команду</strong>
            <p>Выберите выпуск и введите название команды</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div>
            <strong>Подключите соперника</strong>
            <p>Поделитесь ссылкой или QR-кодом</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div>
            <strong>Откройте экран</strong>
            <p>На TV или ноуте — для показа заданий всем</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
