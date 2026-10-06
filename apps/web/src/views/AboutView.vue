<script setup lang="ts">
import teamPhotoUrl from '../assets/about-team.jpg';
import teamPhoto2Url from '../assets/about-team-2.jpg';
</script>

<template>
  <div>
    <h1 class="page-title">О нас</h1>

    <div class="card about-card">
      <div class="about-photos">
        <img
          :src="teamPhotoUrl"
          alt="Команда — призёры SuperQuiz в Минске"
          class="about-photo"
          width="1024"
          height="682"
        />
        <img
          :src="teamPhoto2Url"
          alt="Команда SuperQuiz после игры"
          class="about-photo"
          width="1024"
          height="682"
        />
      </div>

      <p class="about-lead">
        «Игра на унижение» появилась в 2026 году — сначала как простая вечерняя презентация,
        чтобы поиграть с друзьями после работы. Вопросы, смех, спор из‑за баллов: всё держалось
        на слайдах и энтузиазме.
      </p>

      <p>
        Со временем из разовой «поиграть вечером» выросло полноценное интерактивное приложение:
        комнаты, телефоны команд, общий экран, туры и выпуски. Мы сами гоняли его на дружеских
        встречах, правили правила и интерфейс, пока игра не стала удобной не только «для своих».
      </p>

      <p>
        Создаётся и тестируется призёрами
        <a href="https://t.me/superquizminsk" target="_blank" rel="noopener noreferrer">SuperQuiz в Минске</a>
        — теми, кто привык приходить, думать и побеждать за одним столом. Опыт живых квизов
        помог оставить в приложении то, что реально работает в компании, без лишней сложности.
      </p>

      <p>
        Теперь мы делимся игрой со всеми желающими: выбирайте выпуск, собирайте команды и
        устраивайте свой вечер унижения.
      </p>
    </div>
  </div>
</template>

<style scoped>
.about-card {
  margin-top: 16px;
}

.about-photos {
  font-size: 0;
  margin: 0 0 16px;
}

.about-photo {
  display: inline-block;
  vertical-align: top;
  width: 100%;
  height: auto;
  box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
}

@media (min-width: 769px) {
  .about-photo {
    width: calc(50% - 6px);
  }

  .about-photo + .about-photo {
    margin-left: 12px;
  }
}

@media (max-width: 768px) {
  .about-photo + .about-photo {
    margin-top: 12px;
  }
}

.about-lead {
  font-size: 1.05rem;
  font-weight: 600;
}

.about-card p {
  margin: 0 0 12px;
}

.about-card p:last-child {
  margin-bottom: 0;
}
</style>
