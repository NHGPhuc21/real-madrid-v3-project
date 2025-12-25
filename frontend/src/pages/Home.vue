<!-- Home.vue -->
<template>
  <div class="home">
    <!-- SCOREBOARD: đặt NGAY DƯỚI NAVBAR, tách khỏi hero để full width -->
    <MatchScoreboard
      v-if="currentMatch && (currentMatch.status === 'live')"
      :match="currentMatch"
    />

    <!-- HERO -->
    <section class="hero text-white">
      <div class="hero-content text-center">
        <ChristmasGiftBox @open="showGiftAnimation = true" />




        <div class="hero-welcome">
          <h1 class="display-5 fw-bold mb-3">Welcome to Real Madrid FC</h1>
        <p class="lead mb-4">The best club in the world</p>
        <p>
          36 La Liga titles, 15 Champion League trophies, and countless other
          honors make us the most successful football club in history
        </p>
        </div>
      </div>
    </section>

    <!-- 🌟 FEATURED NEWS (một bài đặc biệt) -->
    <section v-if="featured" class="section featured-section">
      <div class="container">
        <div class="row g-0 align-items-stretch featured-row">
          <!-- Ảnh lớn bên trái -->
          <div class="col-lg-7">
            <div class="featured-image-wrapper">
              <img
                v-if="featured.imageurl"
                :src="ABS(featured.imageurl)"

                alt=""
                class="featured-image"
              />
            </div>
          </div>

          <!-- Tiêu đề / nội dung bên phải -->
          <div class="col-lg-5 d-flex">
            <div class="featured-body">
              <div class="card-body d-flex flex-column">
                <span class="badge bg-primary-subtle text-primary mb-2 d-none">
                  Featured
                </span>

                <h2 class="featured-title mb-3">
                  {{ featured.title }}
                </h2>

                <p class="text-muted small mb-3">
                  {{ formatDate(featured.publishdate || featured.created_at) }}
                </p>

                <p class="featured-text mb-4">
                  {{ short(featured.content, 260) }}
                </p>

                <RouterLink
  :to="`/news/${featured.newid || featured.id || featured.newsid}`"
  class="news-read-btn mt-auto align-self-start"
>
  Read article
</RouterLink>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ====== CLUB NEWS (TOPIC 'club') - Đặt TRÊN Upcoming Matches ====== -->
    <section class="section bg-light">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="section-title">Club News</h3>
          <RouterLink class="gradient-btn" to="/news">See all</RouterLink>

        </div>

        <div v-if="clubLoading" class="text-muted">Loading…</div>
        <div v-else-if="!newsClub.length" class="text-muted">No articles.</div>

        <!-- Carousel cho Club News -->
        <div v-else class="news-carousel position-relative">
          <!-- Nút trái: chỉ hiện nếu có > 3 bài -->
          <button
            v-if="newsClub.length > 3"
            class="carousel-btn left"
            :disabled="!clubCanPrev"
            @click="scrollClubByCards(-1)"
            aria-label="Previous club news"
          >
            <i class="bi bi-chevron-left"></i>
          </button>

          <!-- Track -->
          <div class="news-track" ref="clubTrackRef">
            <div
              class="news-card"
              v-for="n in newsClub"
              :key="n.newid || n.newsid || n.id"
            >
              <div class="card h-100 shadow-sm">
                <img
                  v-if="n.imageurl"
                  :src="ABS(n.imageurl)"

                  class="news-thumb"
                  alt=""
                />
                <div class="card-body d-flex flex-column">
                  <h6 class="card-title">{{ n.title }}</h6>
                  <p class="card-text small text-muted mb-2">
                    {{ short(n.content, 120) }}
                  </p>
                  <div class="mt-auto d-flex align-items-center justify-content-between">
                    <span class="badge bg-secondary">
                      {{ formatDate(n.publishdate || n.created_at) }}
                    </span>
                    <a
                      :href="`/news/${n.newid || n.id || n.newsid}`"
                      class="btn btn-sm btn-outline-primary"
                      target="_blank"
                      rel="noopener"
                    >
                      Read more
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Nút phải -->
          <button
            v-if="newsClub.length > 3"
            class="carousel-btn right"
            :disabled="!clubCanNext"
            @click="scrollClubByCards(1)"
            aria-label="Next club news"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- UPCOMING MATCHES -->
    <section class="section">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="section-title">Buy Tickets</h3>
        </div>

        <div v-if="mLoading" class="text-muted">Loading matches…</div>
        <div v-else-if="!matches.length" class="text-muted">No upcoming matches.</div>

        <!-- Carousel for matches -->
        <div v-else class="matches-carousel position-relative">
          <!-- Prev -->
          <button
            class="carousel-btn left"
            :disabled="!canPrev"
            @click="scrollByCards(-1)"
            aria-label="Previous matches"
          >
            <i class="bi bi-chevron-left"></i>
          </button>

          <!-- Track -->
          <div class="matches-track" ref="trackRef">
            <div class="match-card" v-for="m in matches" :key="m.matchid">
              <div class="card h-100 shadow-sm fixture-card">
                <!-- HEADER: 2 logos -->
                <div class="fixture-head">
                  <div class="team">
                    <img :src="homeLogo(m)" alt="" />
                    <span class="team-name">{{ homeName(m) }}</span>
                  </div>
                  <div class="vs">vs</div>
                  <div class="team">
                    <img :src="awayLogo(m)" alt="" />
                    <span class="team-name">{{ awayName(m) }}</span>
                  </div>
                </div>

                <!-- BODY: details -->
                <div class="card-body">
                  <div class="small text-uppercase text-muted fw-semibold mb-1">
                    {{ m.competition || 'Friendly' }}
                  </div>

                  <h5 class="card-title mb-2">{{ titleLine(m) }}</h5>

                  <ul class="list-unstyled small text-muted mb-3">
                    <li class="mb-1">
                      <i class="bi bi-calendar-event me-1"></i>{{ formatDate(m.matchdatetime) || 'TBD' }}
                    </li>
                    <li>
                      <i class="bi bi-geo-alt me-1"></i>{{ m.stadium || 'TBD' }}
                    </li>
                  </ul>

                  <button class="btn btn-primary fw-semibold" @click="openBuyModal(m)">
  Buy Tickets
</button>

                </div>
              </div>
            </div>
          </div>

          <!-- Next -->
          <button
            class="carousel-btn right"
            :disabled="!canNext"
            @click="scrollByCards(1)"
            aria-label="Next matches"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- ====== ACADEMY NEWS (TOPIC 'academy') - Đặt DƯỚI Upcoming Matches ====== -->
    <section class="section">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="section-title">Academy</h3>
          <RouterLink class="gradient-btn" to="/news">See all</RouterLink>

        </div>

        <div v-if="academyLoading" class="text-muted">Loading…</div>
        <div v-else-if="!newsAcademy.length" class="text-muted">No articles.</div>

        <div v-else class="news-carousel position-relative">
          <!-- Prev -->
          <button
            v-if="newsAcademy.length > 3"
            class="carousel-btn left"
            :disabled="!academyCanPrev"
            @click="scrollAcademyByCards(-1)"
            aria-label="Previous academy news"
          >
            <i class="bi bi-chevron-left"></i>
          </button>

          <!-- Track -->
          <div class="news-track" ref="academyTrackRef">
            <div
              class="news-card"
              v-for="n in newsAcademy"
              :key="n.newid || n.newsid || n.id"
            >
              <div class="card h-100 shadow-sm">
                <img
                  v-if="n.imageurl"
                  :src="ABS(n.imageurl)"

                  class="news-thumb"
                  alt=""
                />
                <div class="card-body d-flex flex-column">
                  <h6 class="card-title">{{ n.title }}</h6>
                  <p class="card-text small text-muted mb-2">
                    {{ short(n.content, 120) }}
                  </p>

                  <div class="mt-auto d-flex align-items-center justify-content-between">
                    <span class="badge bg-secondary">
                      {{ formatDate(n.publishdate || n.created_at) }}
                    </span>
                    <a
                      :href="`/news/${n.newid || n.id || n.newsid}`"
                      class="news-read-btn"
                      target="_blank"
                      rel="noopener"
                    >
                      Read more
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Next -->
          <button
            v-if="newsAcademy.length > 3"
            class="carousel-btn right"
            :disabled="!academyCanNext"
            @click="scrollAcademyByCards(1)"
            aria-label="Next academy news"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- ================= PLAYERS SECTION ================= -->
    <section class="section bg-light">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="section-title">Players</h3>
          <RouterLink to="/players" class="home-players-btn">
            Watch Players
          </RouterLink>
        </div>

        <div v-if="!players.length" class="text-muted">
          No players yet.
        </div>

        <!-- NEW: Carousel cho Players -->
        <div v-else class="players-carousel position-relative">
          <!-- Prev -->
          <button
            v-if="players.length > 4"
            class="carousel-btn left"
            :disabled="!playersCanPrev"
            @click="scrollPlayersByCards(-1)"
            aria-label="Previous players"
          >
            <i class="bi bi-chevron-left"></i>
          </button>

          <div class="players-track" ref="playersTrackRef">
            <div
              class="player-card-wrapper"
              v-for="p in players"
              :key="p.playerid"
            >
              <div
                class="card shadow-sm h-100 player-card"
                @click="$router.push('/players/' + p.playerid)"
                style="cursor: pointer;"
              >
                <div class="player-img-wrapper">
                  <div class="player-avatar-wrapper">
                    <img
                      :src="avatarSrc(p.imageurl)"
                      alt=""
                      class="player-avatar"
                    />
                  </div>
                </div>

                <div class="card-body player-info">
                  <!-- Số áo -->
                  <div v-if="p.shirtnumber" class="player-number mb-1">
                    {{ p.shirtnumber }}
                  </div>

                  <!-- Tên -->
                  <div class="player-name fw-bold mb-2">
                    {{ p.fullname }}
                  </div>

                  <!-- Vị trí -->
                  <div v-if="p.position" class="player-meta-row">
                    <span class="player-meta-label">Position Play</span>
                    <span class="player-meta-value">{{ p.position }}</span>
                  </div>

                  <!-- Ngày sinh -->
                  <div v-if="p.birthdate" class="player-meta-row">
                    <span class="player-meta-label">Date of Birth</span>
                    <span class="player-meta-value">{{ formatBirthdate(p.birthdate) }}</span>
                  </div>

                  <!-- Quốc tịch -->
                  <div v-if="p.nationality" class="player-meta-row">
                    <span class="player-meta-label">Nationality</span>
                    <span class="player-meta-value">{{ p.nationality }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Next -->
          <button
            v-if="players.length > 4"
            class="carousel-btn right"
            :disabled="!playersCanNext"
            @click="scrollPlayersByCards(1)"
            aria-label="Next players"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>

    

    <!-- ====== SPECIAL NEWS ====== -->
    <section class="section">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="section-title">Special</h3>
          <RouterLink class="gradient-btn" to="/news">See all</RouterLink>

        </div>

        <div v-if="specialLoading" class="text-muted">Loading…</div>
        <div v-else-if="!newsSpecial.length" class="text-muted">No articles.</div>

        <div v-else class="news-carousel position-relative">
          <button
            v-if="newsSpecial.length > 3"
            class="carousel-btn left"
            :disabled="!specialCanPrev"
            @click="scrollSpecialByCards(-1)"
            aria-label="Previous special news"
          >
            <i class="bi bi-chevron-left"></i>
          </button>

          <div class="news-track" ref="specialTrackRef">
            <div
              class="news-card"
              v-for="n in newsSpecial"
              :key="n.newid || n.newsid || n.id"
            >
              <div class="card h-100 shadow-sm">
                <img
                  v-if="n.imageurl"
                  :src="ABS(n.imageurl)"

                  class="news-thumb"
                  alt=""
                />
                <div class="card-body d-flex flex-column">
                  <h6 class="card-title">{{ n.title }}</h6>
                  <p class="card-text small text-muted mb-2">
                    {{ short(n.content, 120) }}
                  </p>
                  <div class="mt-auto d-flex align-items-center justify-content-between">
                    <span class="badge bg-secondary">
                      {{ formatDate(n.publishdate || n.created_at) }}
                    </span>
                    <a
                      :href="`/news/${n.newid || n.id || n.newsid}`"
                      class="news-read-btn"
                      target="_blank"
                      rel="noopener"
                    >
                      Read more
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            v-if="newsSpecial.length > 3"
            class="carousel-btn right"
            :disabled="!specialCanNext"
            @click="scrollSpecialByCards(1)"
            aria-label="Next special news"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>
    <!-- ====== UPCOMING MATCHES - SIMPLE BLOCK (HÌNH 1) ====== -->
    <!-- ====================================== -->
<!-- ================= NEXT MATCHES (HORIZONTAL) ================= -->
<section class="section">
  <div class="container">

    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="section-title">Next Matches</h3>

      <RouterLink class="gradient-btn" to="/matches">
        All Matches →
      </RouterLink>
    </div>

    <div v-if="mLoading" class="text-muted">Loading…</div>
    <div v-else-if="!matches.length" class="text-muted">No upcoming matches.</div>

    <!-- BLOCK: 3 MATCH CARDS IN A ROW -->
    <div class="next-matches-row" v-else>
      <div
        class="nm-card"
        v-for="m in matches.slice(0, 3)"
        :key="m.matchid"
      >
        <div class="nm-card-inner">

          <!-- LEFT TEAM -->
          <div class="nm-team-side">
            <img :src="homeLogo(m)" class="nm-logo">
            <div class="nm-team-name">{{ homeName(m) }}</div>
          </div>

          <!-- DATE -->
          <div class="nm-center">
            <div class="nm-date">{{ formatVN(m.matchdatetime) }}</div>
          </div>

          <!-- RIGHT TEAM -->
          <div class="nm-team-side">
            <img :src="awayLogo(m)" class="nm-logo">
            <div class="nm-team-name">{{ awayName(m) }}</div>
          </div>

        </div>
      </div>
      
      <div class="note-time">Time on the board is Viet Nam time</div>
    </div>

  </div>
</section>




    <!-- ====== MADRIDISTAS NEWS ====== -->
    <section class="section">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="section-title">Madridistas</h3>
          <RouterLink class="gradient-btn" to="/news">See all</RouterLink>

        </div>

        <div v-if="madridistasLoading" class="text-muted">Loading…</div>
        <div v-else-if="!newsMadridistas.length" class="text-muted">No articles.</div>

        <div v-else class="news-carousel position-relative">
          <button
            v-if="newsMadridistas.length > 3"
            class="carousel-btn left"
            :disabled="!madridistasCanPrev"
            @click="scrollMadridistasByCards(-1)"
            aria-label="Previous madridistas news"
          >
            <i class="bi bi-chevron-left"></i>
          </button>

          <div class="news-track" ref="madridistasTrackRef">
            <div
              class="news-card"
              v-for="n in newsMadridistas"
              :key="n.newid || n.newsid || n.id"
            >
              <div class="card h-100 shadow-sm">
                <img
                  v-if="n.imageurl"
                  :src="ABS(n.imageurl)"

                  class="news-thumb"
                  alt=""
                />
                <div class="card-body d-flex flex-column">
                  <h6 class="card-title">{{ n.title }}</h6>
                  <p class="card-text small text-muted mb-2">
                    {{ short(n.content, 120) }}
                  </p>
                  <div class="mt-auto d-flex align-items-center justify-content-between">
                    <span class="badge bg-secondary">
                      {{ formatDate(n.publishdate || n.created_at) }}
                    </span>
                    <a
                      :href="`/news/${n.newid || n.id || n.newsid}`"
                      class="news-read-btn"
                      target="_blank"
                      rel="noopener"
                    >
                      Read more
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            v-if="newsMadridistas.length > 3"
            class="carousel-btn right"
            :disabled="!madridistasCanNext"
            @click="scrollMadridistasByCards(1)"
            aria-label="Next madridistas news"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>


    <!-- Trang thành tích clb -->
    <PalmaresSummary class="my-5" />

    
    <!-- ====== SPONSORS NEWS ====== -->
    <section class="section">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="section-title">Sponsors</h3>
          <RouterLink class="gradient-btn" to="/news">See all</RouterLink>

        </div>

        <div v-if="sponsorsLoading" class="text-muted">Loading…</div>
        <div v-else-if="!newsSponsors.length" class="text-muted">No articles.</div>

        <div v-else class="news-carousel position-relative">
          <button
            v-if="newsSponsors.length > 3"
            class="carousel-btn left"
            :disabled="!sponsorsCanPrev"
            @click="scrollSponsorsByCards(-1)"
            aria-label="Previous sponsors news"
          >
            <i class="bi bi-chevron-left"></i>
          </button>

          <div class="news-track" ref="sponsorsTrackRef">
            <div
              class="news-card"
              v-for="n in newsSponsors"
              :key="n.newid || n.newsid || n.id"
            >
              <div class="card h-100 shadow-sm">
                <img
                  v-if="n.imageurl"
                  :src="ABS(n.imageurl)"

                  class="news-thumb"
                  alt=""
                />
                <div class="card-body d-flex flex-column">
                  <h6 class="card-title">{{ n.title }}</h6>
                  <p class="card-text small text-muted mb-2">
                    {{ short(n.content, 120) }}
                  </p>
                  <div class="mt-auto d-flex align-items-center justify-content-between">
                    <span class="badge bg-secondary">
                      {{ formatDate(n.publishdate || n.created_at) }}
                    </span>
                    <a
                      :href="`/news/${n.newid || n.id || n.newsid}`"
                      class="news-read-btn"
                      target="_blank"
                      rel="noopener"
                    >
                      Read more
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            v-if="newsSponsors.length > 3"
            class="carousel-btn right"
            :disabled="!sponsorsCanNext"
            @click="scrollSponsorsByCards(1)"
            aria-label="Next sponsors news"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>

    

    <!-- ====== GENERAL NEWS ====== -->
    <section class="section">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="section-title">General News</h3>
          <RouterLink class="gradient-btn" to="/news">See all</RouterLink>

        </div>

        <div v-if="generalLoading" class="text-muted">Loading…</div>
        <div v-else-if="!newsGeneral.length" class="text-muted">No articles.</div>

        <div v-else class="news-carousel position-relative">
          <button
            v-if="newsGeneral.length > 3"
            class="carousel-btn left"
            :disabled="!generalCanPrev"
            @click="scrollGeneralByCards(-1)"
            aria-label="Previous general news"
          >
            <i class="bi bi-chevron-left"></i>
          </button>

          <div class="news-track" ref="generalTrackRef">
            <div
              class="news-card"
              v-for="n in newsGeneral"
              :key="n.newid || n.newsid || n.id"
            >
              <div class="card h-100 shadow-sm">
                <img
                  v-if="n.imageurl"
                  :src="ABS(n.imageurl)"

                  class="news-thumb"
                  alt=""
                />
                <div class="card-body d-flex flex-column">
                  <h6 class="card-title">{{ n.title }}</h6>
                  <p class="card-text small text-muted mb-2">
                    {{ short(n.content, 120) }}
                  </p>
                  <div class="mt-auto d-flex align-items-center justify-content-between">
                    <span class="badge bg-secondary">
                      {{ formatDate(n.publishdate || n.created_at) }}
                    </span>
                    <a
                      :href="`/news/${n.newid || n.id || n.newsid}`"
                      class="news-read-btn"
                      target="_blank"
                      rel="noopener"
                    >
                      Read more
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            v-if="newsGeneral.length > 3"
            class="carousel-btn right"
            :disabled="!generalCanNext"
            @click="scrollGeneralByCards(1)"
            aria-label="Next general news"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- ====================== BUY TICKET MODAL ====================== -->
<div class="modal fade" id="buyTicketModal" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">

      <div class="modal-header">
        <h5 class="modal-title">
          Buy Ticket - {{ modalMatch?.opponentteam || 'Match' }}
        </h5>
        <button type="button" class="btn-close" @click="modalInstance?.hide(); cleanModal();"></button>

      </div>

      <div class="modal-body">
        <div v-if="loadingCategories" class="text-center text-muted py-3">
          Loading ticket categories...
        </div>

        <div v-else>
          <!-- Category select -->
          <div class="mb-3">
            <label class="form-label fw-semibold">Ticket Category</label>
            <select v-model="selectedCategoryId" class="form-select">
              <option disabled value="">Select category...</option>
              <option
  v-for="c in modalCategories"
  :key="c.categoryid"
  :value="c.categoryid"
>
  {{ c.categoryname }} — {{ formatCurrency(c.price) }}
  (Available: {{ c.availablequantity }})
</option>

            </select>
          </div>

          <!-- Quantity -->
          <div class="mb-3">
            <label class="form-label fw-semibold">Quantity</label>
            <input type="number" min="1" v-model.number="quantity" class="form-control" />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
  class="btn btn-secondary"
  @click="modalInstance?.hide(); cleanModal();"
>
  Cancel
</button>

        <button class="btn btn-primary" :disabled="loadingBuy" @click="submitBuy">
          <span v-if="loadingBuy">Processing…</span>
          <span v-else>Buy Now</span>
        </button>
      </div>

    </div>
  </div>
</div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import api, { ABS } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { getOpponentLogo, getNewsImage } from '@/services/assets'
import MatchScoreboard from '@/components/MatchScoreboard.vue'
import PalmaresSummary from '@/pages/palmares/PalmaresSummary.vue'
import { useRouter } from 'vue-router'
import ChristmasGiftBox from "@/components/events/christmas/ChristmasGiftBox.vue";
import { loadActiveEvent } from "@/events/useEvent";
import ChristmasGiftAnimation from "@/components/events/christmas/ChristmasGiftAnimation.vue";

const router = useRouter()
let liveInterval = null;

function startLivePolling() {
  // nếu đang có trận live thì mỗi 3 giây auto reload
  liveInterval = setInterval(async () => {
    try {
      const r = await api.get('/matches/current');
      currentMatch.value = r.data?.match || null;
    } catch {}
  }, 5000); // 3000ms = 3 giây
}
const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'admin')

const matches = ref([])
const news = ref([])


/* ===== news theo topic ===== */
const newsClub = ref([])
const newsAcademy = ref([])
const clubLoading = ref(false)
const academyLoading = ref(false)

const featured = ref(null)
const featuredLoading = ref(false)
const currentMatch = ref(null)

const mLoading = ref(false)
const nLoading = ref(false)

// Fallback logo
const RM_LOGO = '/assets/logo/real.png'
const fallbackLogo = RM_LOGO

// Carousel cho Special / Madridistas / Sponsors / General
const specialTrackRef = ref(null)
const specialCanPrev  = ref(false)
const specialCanNext  = ref(false)

const madridistasTrackRef = ref(null)
const madridistasCanPrev  = ref(false)
const madridistasCanNext  = ref(false)

const sponsorsTrackRef = ref(null)
const sponsorsCanPrev  = ref(false)
const sponsorsCanNext  = ref(false)

const generalTrackRef = ref(null)
const generalCanPrev  = ref(false)
const generalCanNext  = ref(false)

// players
const players = ref([])

// ===== Helpers chung =====
function formatDate (dt) {
  if (!dt) return ''
  const src = (typeof dt === 'string' && dt.includes(' ') && !dt.endsWith('Z'))
    ? dt.replace(' ', 'T')
    : dt
  const d = new Date(src)
  if (isNaN(d)) return ''
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  const date = d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${time} ${date}`
}

function avatarSrc (filename) {
  if (!filename) return ''
  if (filename.startsWith('http') || filename.startsWith('data:')) {
    return filename
  }
  if (filename.startsWith('/uploads/')) {
    return ABS(filename)
  }
  return new URL(`../assets/players/${filename}`, import.meta.url).href
}

async function loadPlayers () {
  try {
    const r = await api.get('/players')
    players.value = r.data || []
  } catch (err) {
    console.error('loadPlayers error:', err)
  }
}

function short (t, n) {
  if (!t) return ''
  return t.length > n ? t.slice(0, n) + '…' : t
}

function opponentLogo(m) {
  const u = m.opponentteamlogourl;

  // Nếu DB có URL → dùng luôn
  if (u) return ABS(u);

  // Nếu chưa có logo → dùng logo mặc định của opponent
  return "/assets/logo/default-opponent.png"; 
}

function formatCurrency(v) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(v || 0);
}


// Hiển thị 2 đầu (home/away) theo isHomeMatch
function homeLogo (m) { return (m.ishomematch ? RM_LOGO : opponentLogo(m)) }
function awayLogo (m) { return (m.ishomematch ? opponentLogo(m) : RM_LOGO) }
function homeName (m) { return (m.ishomematch ? 'Real Madrid' : (m.opponentteam || 'Opponent')) }
function awayName (m) { return (m.ishomematch ? (m.opponentteam || 'Opponent') : 'Real Madrid') }
function titleLine (m) { return m.opponentteam || 'Fixture' }

async function loadFeatured () {
  featuredLoading.value = true
  try {
    const r = await api.get('/news/featured')
    featured.value = r.data || null
  } catch (err) {
    console.error('loadFeatured error:', err)
  } finally {
    featuredLoading.value = false
  }
}

async function loadMatches () {
  mLoading.value = true
  try {
    const r = await api.get('/matches', { params: { upcoming: 1 } })
    matches.value = r.data || []
  } finally {
    mLoading.value = false
    nextTick(updateArrows)
  }
}

async function loadNews () {
  nLoading.value = true
  try {
    const r = await api.get('/news')
    news.value = r.data || []
  } finally {
    nLoading.value = false
  }
}

/* ===== gọi API theo topic ===== */
async function loadNewsByTopic (topic, targetRef, loadingRef) {
  loadingRef.value = true
  try {
    const r = await api.get('/news', { params: { topic } })
    targetRef.value = r.data || []
  } finally {
    loadingRef.value = false
  }
}

async function loadCurrentMatch () {
  try {
    const r = await api.get('/matches/current')
    currentMatch.value = r.data?.match || null
  } catch (err) {
    console.error('loadCurrentMatch error:', err)
  }
}

/* ===== Carousel logic – matches ===== */
const trackRef = ref(null)
const canPrev  = ref(false)
const canNext  = ref(false)

// Carousel Club / Academy
const clubTrackRef = ref(null)
const clubCanPrev  = ref(false)
const clubCanNext  = ref(false)

const academyTrackRef = ref(null)
const academyCanPrev  = ref(false)
const academyCanNext  = ref(false)

// 4 topic còn lại
const newsSpecial = ref([])
const newsMadridistas = ref([])
const newsSponsors = ref([])
const newsGeneral = ref([])

const specialLoading = ref(false)
const madridistasLoading = ref(false)
const sponsorsLoading = ref(false)
const generalLoading = ref(false)

// ===== Players carousel state =====
const playersTrackRef = ref(null)
const playersCanPrev = ref(false)
const playersCanNext = ref(false)

function formatBirthdate (d) {
  if (!d) return ''
  try {
    const src = (typeof d === 'string' && d.includes(' ') && !d.endsWith('Z'))
      ? d.replace(' ', 'T')
      : d
    const date = new Date(src)
    if (isNaN(date)) return ''
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return d
  }
}

// ===== Helper scroll mượt (easing) =====
function smoothScrollTo (el, target, duration = 400) {
  if (!el) return
  const start = el.scrollLeft
  const distance = target - start
  const startTime = performance.now()

  function easeInOutQuad (t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  function step (now) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeInOutQuad(progress)
    el.scrollLeft = start + distance * eased
    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

/* ===== Matches arrows ===== */
function updateArrows () {
  const el = trackRef.value
  if (!el) return
  const eps = 2
  canPrev.value = el.scrollLeft > eps
  canNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - eps
}

function scrollByCards (dir) {
  const el = trackRef.value
  if (!el) return
  const card = el.querySelector('.match-card')
  const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.9
  const target = el.scrollLeft + dir * amount
  const clamped = Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth))
  smoothScrollTo(el, clamped, 450)
}

/* ===== Club ===== */
function updateClubArrows () {
  const el = clubTrackRef.value
  if (!el) return
  const eps = 2
  clubCanPrev.value = el.scrollLeft > eps
  clubCanNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - eps
}

function scrollClubByCards (dir) {
  const el = clubTrackRef.value
  if (!el) return
  const card = el.querySelector('.news-card')
  const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.9
  const target = el.scrollLeft + dir * amount
  const clamped = Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth))
  smoothScrollTo(el, clamped, 450)
}

/* ===== Academy ===== */
function updateAcademyArrows () {
  const el = academyTrackRef.value
  if (!el) return
  const eps = 2
  academyCanPrev.value = el.scrollLeft > eps
  academyCanNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - eps
}

function scrollAcademyByCards (dir) {
  const el = academyTrackRef.value
  if (!el) return
  const card = el.querySelector('.news-card')
  const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.9
  const target = el.scrollLeft + dir * amount
  const clamped = Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth))
  smoothScrollTo(el, clamped, 450)
}

/* ===== Special ===== */
function updateSpecialArrows () {
  const el = specialTrackRef.value
  if (!el) return
  const eps = 2
  specialCanPrev.value = el.scrollLeft > eps
  specialCanNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - eps
}
function formatVN(dt) {
  if (!dt) return '';

  const d = new Date(dt);
  if (isNaN(d)) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return `${day}-${month}\n${time}`;
}


function scrollSpecialByCards (dir) {
  const el = specialTrackRef.value
  if (!el) return
  const card = el.querySelector('.news-card')
  const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.9
  const target = el.scrollLeft + dir * amount
  const clamped = Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth))
  smoothScrollTo(el, clamped, 450)
}

/* ===== Madridistas ===== */
function updateMadridistasArrows () {
  const el = madridistasTrackRef.value
  if (!el) return
  const eps = 2
  madridistasCanPrev.value = el.scrollLeft > eps
  madridistasCanNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - eps
}

function scrollMadridistasByCards (dir) {
  const el = madridistasTrackRef.value
  if (!el) return
  const card = el.querySelector('.news-card')
  const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.9
  const target = el.scrollLeft + dir * amount
  const clamped = Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth))
  smoothScrollTo(el, clamped, 450)
}

/* ===== Sponsors ===== */
function updateSponsorsArrows () {
  const el = sponsorsTrackRef.value
  if (!el) return
  const eps = 2
  sponsorsCanPrev.value = el.scrollLeft > eps
  sponsorsCanNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - eps
}

function scrollSponsorsByCards (dir) {
  const el = sponsorsTrackRef.value
  if (!el) return
  const card = el.querySelector('.news-card')
  const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.9
  const target = el.scrollLeft + dir * amount
  const clamped = Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth))
  smoothScrollTo(el, clamped, 450)
}

/* ===== General ===== */
function updateGeneralArrows () {
  const el = generalTrackRef.value
  if (!el) return
  const eps = 2
  generalCanPrev.value = el.scrollLeft > eps
  generalCanNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - eps
}

function scrollGeneralByCards (dir) {
  const el = generalTrackRef.value
  if (!el) return
  const card = el.querySelector('.news-card')
  const amount = card ? card.offsetWidth + 16 : el.clientWidth + 16
  const target = el.scrollLeft + dir * amount
  const clamped = Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth))
  smoothScrollTo(el, clamped, 450)
}
// 🔥 Clean modal để không khóa dropdown bootstrap
function cleanModal() {
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";

  document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());

  const modals = document.querySelectorAll(".modal.show");
  modals.forEach(m => {
    m.classList.remove("show");
    m.style.display = "none";
  });
}

/* ===== Players carousel ===== */
function updatePlayersArrows () {
  const el = playersTrackRef.value
  if (!el) return
  const eps = 2
  playersCanPrev.value = el.scrollLeft > eps
  playersCanNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - eps
}

function scrollPlayersByCards (dir) {
  const el = playersTrackRef.value
  if (!el) return
  const card = el.querySelector('.player-card-wrapper')
  const amount = card ? card.offsetWidth + 24 : el.clientWidth * 0.9
  const target = el.scrollLeft + dir * amount
  const clamped = Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth))
  smoothScrollTo(el, clamped, 450)
}

/* ===== WATCHERS / LIFECYCLE ===== */
watch(
  () => trackRef.value,
  (el, oldEl) => {
    if (oldEl) oldEl.removeEventListener('scroll', updateArrows)
    if (el) {
      el.addEventListener('scroll', updateArrows, { passive: true })
      nextTick(updateArrows)
    }
  },
  { immediate: true }
)

watch(
  () => clubTrackRef.value,
  (el, oldEl) => {
    if (oldEl) oldEl.removeEventListener('scroll', updateClubArrows)
    if (el) {
      el.addEventListener('scroll', updateClubArrows, { passive: true })
      nextTick(updateClubArrows)
    }
  },
  { immediate: true }
)

watch(
  () => academyTrackRef.value,
  (el, oldEl) => {
    if (oldEl) oldEl.removeEventListener('scroll', updateAcademyArrows)
    if (el) {
      el.addEventListener('scroll', updateAcademyArrows, { passive: true })
      nextTick(updateAcademyArrows)
    }
  },
  { immediate: true }
)

watch(
  () => specialTrackRef.value,
  (el, oldEl) => {
    if (oldEl) oldEl.removeEventListener('scroll', updateSpecialArrows)
    if (el) {
      el.addEventListener('scroll', updateSpecialArrows, { passive: true })
      nextTick(updateSpecialArrows)
    }
  },
  { immediate: true }
)

watch(
  () => madridistasTrackRef.value,
  (el, oldEl) => {
    if (oldEl) oldEl.removeEventListener('scroll', updateMadridistasArrows)
    if (el) {
      el.addEventListener('scroll', updateMadridistasArrows, { passive: true })
      nextTick(updateMadridistasArrows)
    }
  },
  { immediate: true }
)

watch(
  () => sponsorsTrackRef.value,
  (el, oldEl) => {
    if (oldEl) oldEl.removeEventListener('scroll', updateSponsorsArrows)
    if (el) {
      el.addEventListener('scroll', updateSponsorsArrows, { passive: true })
      nextTick(updateSponsorsArrows)
    }
  },
  { immediate: true }
)

watch(
  () => generalTrackRef.value,
  (el, oldEl) => {
    if (oldEl) oldEl.removeEventListener('scroll', updateGeneralArrows)
    if (el) {
      el.addEventListener('scroll', updateGeneralArrows, { passive: true })
      nextTick(updateGeneralArrows)
    }
  },
  { immediate: true }
)

watch(
  () => playersTrackRef.value,
  (el, oldEl) => {
    if (oldEl) oldEl.removeEventListener('scroll', updatePlayersArrows)
    if (el) {
      el.addEventListener('scroll', updatePlayersArrows, { passive: true })
      nextTick(updatePlayersArrows)
    }
  },
  { immediate: true }
)

watch(newsClub, () => nextTick(updateClubArrows), { deep: true })
watch(newsAcademy, () => nextTick(updateAcademyArrows), { deep: true })
watch(newsSpecial, () => nextTick(updateSpecialArrows), { deep: true })
watch(newsMadridistas, () => nextTick(updateMadridistasArrows), { deep: true })
watch(newsSponsors, () => nextTick(updateSponsorsArrows), { deep: true })
watch(newsGeneral, () => nextTick(updateGeneralArrows), { deep: true })
watch(players, () => nextTick(updatePlayersArrows), { deep: true })

onBeforeUnmount(() => {
  const el = trackRef.value
  if (el) el.removeEventListener('scroll', updateArrows)

  const elClub = clubTrackRef.value
  if (elClub) elClub.removeEventListener('scroll', updateClubArrows)

  const elAca = academyTrackRef.value
  if (elAca) elAca.removeEventListener('scroll', updateAcademyArrows)

  const elSpecial = specialTrackRef.value
  if (elSpecial) elSpecial.removeEventListener('scroll', updateSpecialArrows)

  const elMad = madridistasTrackRef.value
  if (elMad) elMad.removeEventListener('scroll', updateMadridistasArrows)

  const elSponsors = sponsorsTrackRef.value
  if (elSponsors) elSponsors.removeEventListener('scroll', updateSponsorsArrows)
  
  const elGeneral = generalTrackRef.value
  if (elGeneral) elGeneral.removeEventListener('scroll', updateGeneralArrows)
  if (liveInterval) clearInterval(liveInterval);
  const elPlayers = playersTrackRef.value
  if (elPlayers) elPlayers.removeEventListener('scroll', updatePlayersArrows)
// 🔥 Nếu modal instance còn tồn tại → hide()
  if (modalInstance) {
    try { modalInstance.hide(); }
    catch {}

    modalInstance = null;
  }
  cleanModal();

  

  // 🔥 Xoá class show nếu modal chưa ẩn
  const modalEl = document.getElementById("buyTicketModal");
if (modalEl) {
  modalEl.classList.remove("show");
  modalEl.style.display = "none";
  }
})

watch(matches, () => nextTick(updateArrows), { deep: true })

onMounted(() => {
  loadActiveEvent();
  loadMatches();
  loadNews();
  loadCurrentMatch().then(() => {
    startLivePolling();    // ✔️ gọi đúng
  });
  loadCurrentMatch();
  loadPlayers();
  loadNewsByTopic('club', newsClub, clubLoading);
  loadNewsByTopic('academy', newsAcademy, academyLoading);
  loadNewsByTopic('featured', newsSpecial, specialLoading);
  loadNewsByTopic('madridistas', newsMadridistas, madridistasLoading);
  loadNewsByTopic('sponsor', newsSponsors, sponsorsLoading);
  loadNewsByTopic('general', newsGeneral, generalLoading);
  loadFeatured();
  

  // 🔥 Clean modal
  const modalEl = document.getElementById("buyTicketModal");
  if (modalEl) {
    modalEl.classList.remove("show");
    modalEl.style.display = "none";
    modalEl.style.zIndex = "100";          // không che navbar
  }

  // 🔥 Xoá backdrop
  document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());

  
});

// ======================= BUY TICKETS MODAL LOGIC =======================
import { Modal } from 'bootstrap'

// modal state
const modalMatch = ref(null)
const modalCategories = ref([])
const selectedCategoryId = ref("")
const quantity = ref(1)
const loadingCategories = ref(false)
const loadingBuy = ref(false)
let modalInstance = null

function openBuyModal(match) {
  cleanModal();
  modalMatch.value = match
  selectedCategoryId.value = ""
  quantity.value = 1
  modalCategories.value = []

  loadCategories(match.matchid)

  nextTick(() => {
    const modalEl = document.getElementById("buyTicketModal")
    modalInstance = new Modal(modalEl, {
  backdrop: false,  // ❗ Không tạo backdrop
  keyboard: false   // ❗ Không đóng modal bằng phím ESC (tránh lỗi)
})

    modalInstance.show()
  })
}

async function loadCategories(matchId) {
  loadingCategories.value = true
  try {
    const r = await api.get(`/tickets/by-match/${matchId}`)
    modalCategories.value = r.data || []
  } catch (err) {
    console.error("loadCategories error:", err)
  } finally {
    loadingCategories.value = false
  }
}

async function submitBuy() {
  if (!selectedCategoryId.value) {
    alert("Please select a ticket category.")
    return
  }

  loadingBuy.value = true
  try {
    const payload = {
      matchId: modalMatch.value.matchid,
      categoryId: selectedCategoryId.value,
      quantity: quantity.value
    }

    const r = await api.post("/ticket-orders/quick-buy", payload)
    const orderId = r.data?.orderid

    if (modalInstance) {
    modalInstance.hide();
    cleanModal();   // 🔥 thêm dòng này
}

    


    if (orderId) {
      router.push({ name: "TicketOrderDetail", params: { id: String(orderId) } })
    }
  } catch (err) {
    console.error("submitBuy error:", err)
    alert("Failed to buy ticket.")
  } finally {
    loadingBuy.value = false
  }
}

</script>

<style scoped>
/* HERO */
.hero {
  position: relative;
  background:
    linear-gradient(to bottom, rgba(0,27,58,.55), rgba(0,27,58,.65)),
    url('/assets/logo/ball.png') center/cover no-repeat;
  min-height: 350px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.section-title {
  margin-top: 30px;
  margin-bottom: 40px;
}

.hero .container {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

/* ==== Matches carousel ==== */
.matches-carousel { position: relative; }

.matches-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 6px;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.matches-track::-webkit-scrollbar { height: 8px; }
.matches-track::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,.15);
  border-radius: 4px;
}
.matches-track {
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,.15) transparent;
}

.match-card { flex: 0 0 320px; scroll-snap-align: start; }
@media (min-width: 992px) { .match-card { flex-basis: 360px; } }

.rm-scoreboard {
  position: sticky;
  top: 56px;
  z-index: 1020;
  background: linear-gradient(90deg, #0d2340, #0f2b55 60%, #0d2340);
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  border-radius: 0;
  --side-col: 140px;
}

/* ==== Fixture card styles ==== */
.fixture-card .fixture-head {
  background: radial-gradient(120% 120% at 50% -10%, #0b2a57 0%, #071c39 60%, #05172f 100%);
  color: #fff;
  padding: 12px 16px;
  border-top-left-radius: .5rem;
  border-top-right-radius: .5rem;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  height: 74px;
}
.fixture-card .fixture-head .team {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  min-width: 120px;
  text-align: center;
}
.fixture-card .fixture-head img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.25));
}
.fixture-card .fixture-head .team-name {
  font-weight: 600;
  font-size: .95rem;
  line-height: 1.1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: calc(1.1em * 2);
}
.fixture-card .fixture-head .vs {
  font-weight: 700;
  opacity: .85;
  text-align: center;
}
/* ===== NEXT MATCHES (HORIZONTAL) ===== */
.next-matches-row {
  background: #1f242d;
  padding: 30px;
  border-radius: 20px;
  display: flex;
  gap: 20px;
  justify-content: space-between;
  color: #fff;
  box-shadow: 0 8px 22px rgba(0,0,0,0.35);
  margin-top: 10px;
  flex-wrap: wrap;
}

/* Each match card */
.nm-card {
  flex: 1;
  min-width: 260px;
}

.nm-card-inner {
  background: #2b303b;
  padding: 18px 22px;
  border-radius: 14px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  height: 100%;
}

/* Team block */
.nm-team-side {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nm-logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.nm-team-name {
  font-weight: 600;
  font-size: 0.95rem;
}

/* Center date */
.nm-center {
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.85;
  white-space: pre-line;
}

.note-time {
  margin-top: 12px;
  opacity: 0.7;
  font-size: 0.85rem;
  font-style: italic;
  width: 100%;
}

/* ==== Players cards ==== */
.player-avatar-wrapper {
  width: 160px;
  height: 160px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 3px solid #625d5d; 
}
.player-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-img-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.player-info {
  text-align: left;
  padding: 16px 20px 20px;
}

.player-number {
  font-size: 1.6rem;
  font-weight: 700;
}

.player-name {
  font-size: 1rem;
  margin-bottom: 0.4rem;
}

.player-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
}

.player-meta-label {
  color: #555;
}

.player-meta-value {
  font-weight: 500;
}
/* ===== NEXT MATCHES ===== */
.next-matches-box {
  background: #1f242d;
  border-radius: 20px;
  padding: 30px 32px;
  color: #fff;
  margin-top: 10px;
  box-shadow: 0 8px 22px rgba(0,0,0,0.35);
}

/* Hiện 3 trận (dạng card đều nhau) */
.nm-item {
  background: #2b303b;
  border-radius: 14px;
  padding: 16px 22px;
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nm-team {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nm-logo {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.nm-name {
  font-weight: 600;
}

.nm-date {
  text-align: center;
  font-size: 0.95rem;
  white-space: pre-line;
  opacity: 0.85;
}

.note-time {
  margin-top: 8px;
  opacity: 0.7;
  font-size: 0.85rem;
  font-style: italic;
}

/* Button "Watch Players" gradient */
.home-players-btn {
  display: inline-block;
  padding: 10px 32px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffffff;
  text-decoration: none;
  border-radius: 999px;
  background: linear-gradient(90deg, #3b39f2, #9b6dfc);
  box-shadow: 0 4px 12px rgba(59, 57, 242, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.home-players-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(59, 57, 242, 0.45);
}

/* ===== Players carousel track ===== */
.players-carousel {
  position: relative;
}

.players-track {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 4px 0 10px;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.players-track::-webkit-scrollbar { height: 8px; }
.players-track::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,.15);
  border-radius: 4px;
}
.players-track {
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,.15) transparent;
}

/* mỗi player-card chiếm khoảng 1/4 màn hình desktop */
.player-card-wrapper {
  flex: 0 0 260px;
  max-width: 280px;
  scroll-snap-align: start;
}

@media (min-width: 1200px) {
  .player-card-wrapper {
    flex-basis: 260px;
  }
}
/* css cho phần lịch thi đấu */
.match-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.team {
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
/* ================= NEXT MATCHES BLOCK ================= */
.next-matches-section {
  background: #1f242d;
  padding: 24px 30px;
  border-radius: 20px;
  color: #fff;
  margin-top: 40px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;

  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.07);
}


.next-matches-block {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}


.next-match-item {
  flex: 1;
  padding: 18px 22px;
  background: #2a2f3a;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nm-team {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nm-logo {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.nm-name {
  font-size: 1rem;
  font-weight: 600;
}

.nm-date {
  font-size: 0.95rem;
  text-align: right;
  opacity: 0.85;
  white-space: pre-line;
}

.note-time {
  margin-top: 12px;
  color: #aaa;
  font-size: 0.85rem;
  font-style: italic;
}

/* News carousel shared styles */
.news-carousel {
  position: relative;
}

.news-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 6px;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.news-track::-webkit-scrollbar { height: 8px; }
.news-track::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,.15);
  border-radius: 4px;
}
.news-track {
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,.15) transparent;
}

.news-track .news-card {
  flex: 0 0 320px !important;
  max-width: 360px;
  scroll-snap-align: start;
}

@media (min-width: 992px) {
  .news-track .news-card {
    flex-basis: 360px !important;
  }
}

/* Ảnh news */
.news-thumb {
  width: 100%;
  height: 240px; /* bạn chỉnh tùy khung */
  object-fit: contain;   /* giữ nguyên ảnh, không cắt */
  background-color: #f3f3f3;
 /* giúp tạo nền nếu ảnh không đủ tỷ lệ */
  border-radius: 10px;
}


/* Featured news */
.featured-section {
  padding-top: 40px;
  padding-bottom: 40px;
}

.featured-row {
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.15);
}

.featured-image-wrapper {
  height: 100%;
}

.featured-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #f3f3f3;

}


.featured-body {
  height: 100%;
  background: #f7f9fc;
  display: flex;
}

.featured-body .card-body {
  padding: 32px;
}

.featured-title {
  font-size: 1.6rem;
  font-weight: 700;
}

.featured-text {
  font-size: 0.95rem;
  line-height: 1.5;
}

@media (max-width: 991.98px) {
  .featured-body .card-body {
    padding: 20px;
  }
}

/* Arrow buttons (dùng chung) */
/* Arrow buttons – gradient pill giống nút Watch Players */
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b39f2, #9b6dfc);
  box-shadow: 0 6px 18px rgba(59, 57, 242, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  color: #ffffff;
}

.carousel-btn i {
  font-size: 1.1rem;
  line-height: 1;
}

/* vị trí hai bên */
.carousel-btn.left  { left: -12px; }
.carousel-btn.right { right: -12px; }

.carousel-btn:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-52%);
  box-shadow: 0 8px 22px rgba(59, 57, 242, 0.55);
}

.carousel-btn:disabled {
  opacity: 0.35;
  box-shadow: none;
  cursor: default;
}
/* ==== NEW: Unified Gradient Button (See all, Watch More) ==== */
.gradient-btn {
  display: inline-block;
  padding: 8px 22px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff !important;
  text-decoration: none;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #3b39f2, #9b6dfc);
  box-shadow: 0 4px 12px rgba(59, 57, 242, 0.35);
  transition: 0.15s ease;
}

.gradient-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(59, 57, 242, 0.45);
}

.gradient-btn:active {
  transform: scale(0.98);
}
/* Nút "Read article" / "Read more" dạng pill gradient nhỏ */
.news-read-btn {
  display: inline-block;
  padding: 6px 18px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #ffffff !important;
  text-decoration: none;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #3b39f2, #9b6dfc);
  box-shadow: 0 4px 12px rgba(59, 57, 242, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.news-read-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(59, 57, 242, 0.45);
}

.news-read-btn:active {
  transform: scale(0.98);
  box-shadow: 0 3px 8px rgba(59, 57, 242, 0.3);
}
/* ================================
   🔥 Dark Mode – Academy Hero / Big News Card
===================================*/
html[data-bs-theme="dark"] .featured-body {
  background: #1f1f1f !important;
  color: #f0f0f0 !important;
}

html[data-bs-theme="dark"] .featured-body h2,
html[data-bs-theme="dark"] .featured-body p {
  color: #fff !important;
}

html[data-bs-theme="dark"] .big-news-card .meta {
  color: #eaeaea !important;
}

html[data-bs-theme="dark"] .big-news-card .btn {
  background: #5f5cf3 !important;
  color: white !important;
}
html[data-bs-theme="dark"] .news-card .card {
  background: #2b2b2b !important;
  border-color: #444 !important;
  color: #f0f0f0 !important;
}

html[data-bs-theme="dark"] .news-card .card-title,
html[data-bs-theme="dark"] .news-card .card-text {
  color: #ddd !important;
}
.hero-welcome {
  margin-top: 70px; /* tạo khoảng trống cho gift box */
}

</style>
