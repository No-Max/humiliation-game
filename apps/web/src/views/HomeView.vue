<script setup lang="ts">
import Button from '../components/Button.vue';
import heroUrl from '../assets/hero.svg';
</script>

<template>
  <div>
    <img
      :src="heroUrl"
      alt="Игра на унижение — квиз для друзей, позоримся вместе"
      class="home-hero"
      width="1516"
      height="872"
    />
    <div class="card steps-card">
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

    <div class="card intro-card">
      <p class="intro-text">
        Игра на унижение — это очень простая интелектуальная игра не требующая глубоких знаний. Игра состоит из нескольких туров наполненных забавными вопросами и заданиями.
      </p>
      <p class="intro-text">
        Собирайтесь с друзьями, выбирайте выпуск, смейтесь и получайте удовольствие от игры и от ваших знаний.
      </p>
      <p class="intro-text">Удачи!</p>
      <Button class="intro-btn" to="/series">Выбрать выпуск</Button>
    </div>
  </div>
</template>

<style scoped>
.home-hero {
  display: block;
  width: 100%;
  height: auto;
  margin: 0 auto;
  box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
}

.intro-card {
  margin-top: 16px;
}

.intro-btn {
  margin-top: 16px;
}

.steps-card {
  margin-top: 16px;
}

.steps {
  display: block;
  margin-top: 16px;
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
  background: #fec31b;
  color: #1a1a2e;
  text-align: center;
  line-height: 32px;
  font-weight: bold;
}

.step > :not(.step-num) {
  display: inline-block;
  vertical-align: top;
  width: calc(100% - 48px);
  margin-left: 16px;
}

.intro-text {
  margin-bottom: 8px;
}

.intro-text:last-child {
  margin-bottom: 0;
}
</style>
