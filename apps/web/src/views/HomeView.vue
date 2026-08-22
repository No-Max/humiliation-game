<script setup lang="ts">
import Button from '../components/Button.vue';
</script>

<template>
  <div>
    <h1 class="page-title">Добро пожаловать!</h1>
    <div class="card">
      <p class="intro-text">
        Собирайтесь с друзьями, запускайте нашу игру, улыбайтесь и получайте удовольствие от ваших знаний.
      </p>
      <Button to="/series">Выбрать выпуск</Button>
    </div>

    <div class="card">
      <h2 class="section-heading">Как начать играть</h2>
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

<style scoped>
.intro-text {
  margin-bottom: 16px;
}

.section-heading {
  margin-bottom: 16px;
}

.steps {
  display: block;
}

.steps > * + * {
  margin-top: 16px;
}

.step {
  display: block;
}

.step-num {
  display: inline-block;
  vertical-align: top;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4f46e5;
  color: #fff;
  text-align: center;
  line-height: 32px;
  font-weight: 700;
}

.step > :not(.step-num) {
  display: inline-block;
  vertical-align: top;
  width: calc(100% - 48px);
  margin-left: 16px;
}
</style>
