<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { MAX_ROOM_TEAMS } from '@humiliation-game/shared';
import TelegramLoginModal from '../components/TelegramLoginModal.vue';
import { useAuth } from '../composables/useAuth';

const { isAuthenticated } = useAuth();
const showLoginModal = ref(false);
</script>

<template>
  <div>
    <h1 class="page-title">Правила игры</h1>
    <div class="card">
      <h2 class="section-heading">Описание</h2>
      <p class="rules-description">
        Несколько команд отвечают на вопросы по очереди и зарабатывают баллы; команда, набравшая большее количество баллов, побеждает.
        При неверном ответе у команды соперников есть возможность перехватить вопрос и заработать дополнительные баллы.
      </p>
    </div>
    <div class="card">
      <h2 class="section-heading">Как играть</h2>
      <ol class="list-grid how-to-play">
        <li>
          <strong>Выберите выпуск</strong> и создайте комнату — первая команда появляется сразу.
        </li>
        <li>
          <strong>Телефоны команд.</strong> У каждой команды свой телефон (или планшет): на нём лобби,
          ответы, подсказки и ход. В комнату можно пригласить до {{ MAX_ROOM_TEAMS }} команд по ссылке или QR.
        </li>
        <li>
          <strong>Общий экран.</strong> На TV, проекторе или ноутбуке откройте режим «Смотреть» по коду комнаты —
          туда выводятся вопросы, медиа и счёт, чтобы все в комнате видели одно и то же.
        </li>
        <li>
          Когда команды готовы, начните игру с телефона. Игра идёт по турам: на общем экране — задание,
          на телефоне активной команды — поле ответа и таймер.
        </li>
        <li>
          Команды отвечают по очереди. Верный ответ с первой попытки даёт полный балл; при ошибке соперники
          могут перехватить вопрос за меньшее число баллов.
        </li>
        <li>
          После всех туров на экране и на телефонах показывается итог — побеждает команда с наибольшим счётом.
        </li>
      </ol>
      <p class="roles-note text-muted-sm">
        Кратко: телефоны — управление и ответы команд; общий экран — витрина для зрителей и игроков в зале.
      </p>
    </div>
    <div class="card">
      <h2 class="section-heading">Общие правила</h2>
      <ul class="list-grid">
        <li>Делитесь на команды — один телефон на команду, в одной игре до {{ MAX_ROOM_TEAMS }} команд</li>
        <li>Отвечаете по очереди, стоимость вопроса зависит от тура (2 или 3 балла)</li>
        <li>При неверном ответе другая команда может перехватить вопрос, но количество баллов будет уменьшено на 1</li>
        <li>Максимум баллов — только при ответе с первой попытки команды</li>
        <li>После каждого круга ответов показывается следующая подсказка (если есть)</li>
        <li>Перехваты продолжаются, пока кто-то не ответит верно или все не сдадутся</li>
      </ul>
    </div>
    <div class="card">
      <h2 class="section-heading">Советы</h2>
      <ul class="list-grid">
        <li>Следите за очередностью и таймером</li>
        <li>Не торопитесь — случайный ответ может помочь сопернику</li>
        <li>Откройте экран на TV, чтобы все видели задание</li>
        <li>
          <RouterLink v-if="isAuthenticated" to="/profile">Зарегистрируйтесь</RouterLink>
          <a
            v-else
            href="#"
            @click.prevent="showLoginModal = true"
          >Зарегистрируйтесь</a>,
          чтобы сохранить результаты
        </li>
      </ul>
    </div>

    <TelegramLoginModal
      v-if="showLoginModal"
      @close="showLoginModal = false"
      @success="showLoginModal = false"
    />
  </div>
</template>

<style scoped>
.rules-description, .list-grid , .card {
  margin-top: 16px;
}

.how-to-play li + li {
  margin-top: 4px;
}

.roles-note {
  margin-top: 16px;
}
</style>