<template>
  <div class="farm-page">
    <NuxtLink to="/dashboard/fields" class="farm-back">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Назад до полів
    </NuxtLink>

    <div v-if="loading" class="space-y-5 mt-6">
      <div class="farm-card animate-pulse" style="height:160px"></div>
      <div class="farm-card animate-pulse" style="height:120px"></div>
    </div>

    <div v-else-if="farm" class="farm-stack">
      <!-- Основна інформація -->
      <div class="farm-card">
        <div class="farm-card-header">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="farm-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3c0 8-4 10-4 14a4 4 0 008 0c0-4-4-6-4-14z"/>
              </svg>
            </div>
            <div class="min-w-0">
              <h1 class="farm-title bitter">{{ farm.name }}</h1>
              <div v-if="farm.region" class="farm-region">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {{ farm.region }}{{ farm.city ? `, ${farm.city}` : '' }}
              </div>
            </div>
          </div>
          <div class="farm-hectares bitter">{{ farm.hectares }} га</div>
        </div>

        <div v-if="!editing" class="farm-detail-grid">
          <div class="farm-detail-item">
            <span class="farm-detail-label">Назва</span>
            <span class="farm-detail-value">{{ farm.name }}</span>
          </div>
          <div class="farm-detail-item">
            <span class="farm-detail-label">Регіон</span>
            <span class="farm-detail-value">{{ farm.region || '—' }}</span>
          </div>
          <div v-if="farm.city" class="farm-detail-item">
            <span class="farm-detail-label">Населений пункт</span>
            <span class="farm-detail-value">{{ farm.city }}</span>
          </div>
          <div class="farm-detail-item">
            <span class="farm-detail-label">Площа</span>
            <span class="farm-detail-value">{{ farm.hectares }} га</span>
          </div>
          <div v-if="farm.cadastral_number" class="farm-detail-item">
            <span class="farm-detail-label">Кадастровий номер</span>
            <span class="farm-detail-value">{{ farm.cadastral_number }}</span>
          </div>
        </div>

        <!-- Форма редагування -->
        <div v-else class="farm-edit-grid">
          <div>
            <label class="farm-edit-label">Назва</label>
            <input v-model="editForm.name" class="input" />
          </div>
          <div>
            <label class="farm-edit-label">Площа (га)</label>
            <input v-model="editForm.hectares" type="number" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="farm-edit-label">Область</label>
            <div class="relative">
              <input
                v-model="editRegionQuery"
                @input="onEditRegionInput"
                @focus="showEditRegionList = true"
                @blur="() => setTimeout(() => showEditRegionList = false, 150)"
                class="input"
                placeholder="Оберіть область..."
                autocomplete="off"
              />
              <div v-if="showEditRegionList && editFilteredAreas.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto">
                <button
                  v-for="area in editFilteredAreas"
                  :key="area.ref"
                  type="button"
                  @mousedown.prevent="selectEditArea(area)"
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0 text-agro-dark"
                >{{ area.name }}</button>
              </div>
            </div>
          </div>
          <div class="sm:col-span-2">
            <label class="farm-edit-label">Населений пункт</label>
            <div class="relative">
              <input
                v-model="editSettlementQuery"
                @input="onEditSettlementInput"
                @focus="showEditSettlementList = true"
                @blur="() => setTimeout(() => showEditSettlementList = false, 150)"
                class="input"
                placeholder="Місто або село..."
                autocomplete="off"
                :disabled="!editForm.region"
              />
              <div v-if="loadingEditSettlements" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-agro-light">...</div>
              <div v-if="showEditSettlementList && editSettlements.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto">
                <button
                  v-for="s in editSettlements"
                  :key="s.DeliveryCity"
                  type="button"
                  @mousedown.prevent="selectEditSettlement(s)"
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors border-b border-agro-border last:border-0 text-agro-dark"
                >{{ s.Present }}</button>
              </div>
            </div>
          </div>
          <div class="sm:col-span-2">
            <label class="farm-edit-label">Кадастровий номер</label>
            <input v-model="editForm.cadastral_number" class="input" placeholder="Необов'язково" />
          </div>
        </div>

        <div class="flex gap-3 mt-5">
          <button v-if="!editing" @click="startEdit" class="farm-edit-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Редагувати
          </button>
          <template v-else>
            <button @click="saveFarm" :disabled="saving" class="btn-primary text-sm py-2">{{ saving ? '...' : 'Зберегти' }}</button>
            <button @click="editing = false" class="farm-edit-btn">Скасувати</button>
          </template>
        </div>
      </div>

      <!-- Культури -->
      <div class="farm-card">
        <div class="farm-section-header">
          <div class="flex items-center gap-2.5">
            <div class="farm-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2C7 6 4 10 4 14a8 8 0 0016 0c0-4-3-8-8-12z"/><path d="M12 22v-8"/>
              </svg>
            </div>
            <h2 class="farm-section-title bitter">Культури</h2>
          </div>
          <button @click="isPro || crops.length === 0 ? showAddCrop = true : showPaywall = true" class="farm-add-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Додати
          </button>
        </div>

        <div v-if="crops.length === 0" class="text-center py-8 text-agro-light">
          Поки немає культур
        </div>

        <div v-else class="space-y-3">
          <div v-for="(crop, index) in crops" :key="crop.id" class="relative flex items-center gap-4 p-4 bg-agro-bg rounded-xl">
            <!-- Замок для заблокованих культур -->
            <div v-if="!isPro && index > 0" class="absolute inset-0 rounded-xl flex items-center justify-center bg-white/70 backdrop-blur-sm z-10 gap-2">
              <span class="text-xl">🔒</span>
              <span class="text-sm font-semibold text-agro-dark">Доступно в PRO</span>
              <NuxtLink to="/dashboard/subscription" class="text-xs text-agro underline ml-1">Оновити</NuxtLink>
            </div>
            <img :src="`/crops/${cropToSlug(crop.crop_type)}.svg`" :alt="crop.crop_type" class="w-7 h-7 object-contain shrink-0" @error="($event.target as HTMLImageElement).style.display='none'" />
            <div class="flex-1">
              <p class="font-semibold text-agro-dark">{{ crop.crop_type }}{{ crop.variety ? ` · ${crop.variety}` : '' }}</p>
              <p class="text-xs text-agro-light">{{ crop.area_ha }} га{{ crop.planned_yield_t ? ` · план ${crop.planned_yield_t} т/га` : '' }}</p>
              <p v-if="farm && parseFloat(crop.area_ha) > parseFloat(farm.hectares)" class="text-xs text-amber-600 font-semibold mt-0.5">
                ⚠ Перевищує площу поля ({{ farm.hectares }} га)
              </p>
            </div>
            <NuxtLink
              :to="farm && parseFloat(crop.area_ha) > parseFloat(farm.hectares) ? undefined : `/dashboard/ai-chat?farmId=${farmId}&cropId=${crop.id}&cropType=${encodeURIComponent(crop.crop_type)}${crop.variety ? '&variety=' + encodeURIComponent(crop.variety) : ''}`"
              class="btn-outline text-sm py-1.5 px-3 flex items-center gap-1.5 shrink-0"
              :class="{ 'opacity-40 pointer-events-none': farm && parseFloat(crop.area_ha) > parseFloat(farm.hectares) }"
              title="AI консультація по цій культурі"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/>
                <path d="M19 17l.9 2.1L22 20l-2.1.9L19 23l-.9-2.1L16 20l2.1-.9L19 17z"/>
              </svg>
              AI
            </NuxtLink>
            <NuxtLink
              :to="farm && parseFloat(crop.area_ha) > parseFloat(farm.hectares) ? undefined : `/dashboard/protection?farmCropId=${crop.id}&cropType=${crop.crop_type}`"
              class="btn-outline text-sm py-1.5 px-3 flex items-center gap-1.5"
              :class="{ 'opacity-40 pointer-events-none': farm && parseFloat(crop.area_ha) > parseFloat(farm.hectares) }"
            ><ShieldCheck :size="14" /> Тех. карта</NuxtLink>
            <button @click="toggleCatalog(crop)"
              :title="crop.show_in_catalog !== false ? 'Сховати з каталогу фермерів' : 'Показати у каталозі фермерів'"
              class="text-sm py-1.5 px-3 inline-flex items-center gap-1.5 rounded-[10px] border-2 font-bold transition-colors shrink-0"
              :class="crop.show_in_catalog !== false
                ? 'border-[#2F5233] text-[#2F5233] hover:bg-[#EEF1E3]'
                : 'border-agro-border text-agro-light hover:bg-agro-hover'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="crop.show_in_catalog !== false ? '<path d=\'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z\'/><circle cx=\'12\' cy=\'12\' r=\'3\'/>' : '<path d=\'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22\'/>'"/>
              {{ crop.show_in_catalog !== false ? 'Каталог' : 'Приховано' }}
            </button>
            <button @click="openEditCrop(crop)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-agro-hover transition-colors text-agro" title="Редагувати культуру">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button @click="deleteCrop(crop)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-red-400">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Сівозміна (поки приховано) -->
      <div v-if="false" class="card">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="font-bold text-agro-dark text-lg flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0113.5-5.7M20 12a8 8 0 01-13.5 5.7"/><path d="M17.5 3v3.5H14M6.5 21v-3.5H10"/></svg> Сівозміна та врожайність</h2>
            <p class="text-agro-light text-sm mt-0.5">Облік культур і врожаю по роках</p>
          </div>
          <button @click="showAddRotation = true" class="btn-primary text-sm py-2">➕ Додати рік</button>
        </div>

        <div v-if="rotation.length === 0" class="text-center py-8 text-agro-light text-sm">
          Журнал сівозміни порожній — додайте записи по роках
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-agro-border">
                <th class="text-left pb-3 text-xs text-agro-light uppercase tracking-wide font-medium">Рік</th>
                <th class="text-left pb-3 text-xs text-agro-light uppercase tracking-wide font-medium">Культура</th>
                <th class="text-left pb-3 text-xs text-agro-light uppercase tracking-wide font-medium">Сорт</th>
                <th class="text-right pb-3 text-xs text-agro-light uppercase tracking-wide font-medium">Площа, га</th>
                <th class="text-right pb-3 text-xs text-agro-light uppercase tracking-wide font-medium">План т/га</th>
                <th class="text-right pb-3 text-xs text-agro-light uppercase tracking-wide font-medium">Факт т/га</th>
                <th class="pb-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-agro-border">
              <tr v-for="r in rotation" :key="r.id" class="hover:bg-agro-bg transition-colors">
                <td class="py-3 font-bold text-agro">{{ r.year }}</td>
                <td class="py-3 font-medium text-agro-dark">
                  <span class="inline-flex items-center gap-1.5">
                    <img :src="`/crops/${cropToSlug(r.crop_type)}.svg`" :alt="r.crop_type" class="w-4 h-4 object-contain" @error="($event.target as HTMLImageElement).style.display='none'" />
                    {{ r.crop_type }}
                  </span>
                </td>
                <td class="py-3 text-agro-light">{{ r.variety || '—' }}</td>
                <td class="py-3 text-right text-agro-dark">{{ r.area_ha || '—' }}</td>
                <td class="py-3 text-right text-agro-light">{{ r.planned_yield_t || '—' }}</td>
                <td class="py-3 text-right">
                  <span v-if="r.actual_yield_t" class="font-semibold" :class="r.actual_yield_t >= (r.planned_yield_t || 0) ? 'text-agro' : 'text-orange-500'">
                    {{ r.actual_yield_t }}
                  </span>
                  <span v-else class="text-agro-light">—</span>
                </td>
                <td class="py-3 pl-2">
                  <div class="flex gap-1 justify-end">
                    <button @click="editRotationRow(r)" class="w-7 h-7 rounded-lg hover:bg-agro-hover flex items-center justify-center text-agro-light hover:text-agro transition-colors">✏️</button>
                    <button @click="deleteRotation(r.id)" class="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-300 hover:text-red-500 transition-colors">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- AI Консультації -->
      <div class="farm-card">
        <div class="farm-section-header">
          <div class="flex items-center gap-2.5">
            <div class="farm-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/>
                <path d="M19 17l.9 2.1L22 20l-2.1.9L19 23l-.9-2.1L16 20l2.1-.9L19 17z"/>
              </svg>
            </div>
            <h2 class="farm-section-title bitter">AI Консультації</h2>
          </div>
          <NuxtLink :to="`/dashboard/ai-chat?farmId=${route.params.id}`" class="farm-edit-btn inline-flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Нова консультація
          </NuxtLink>
        </div>

        <!-- Швидкий старт по культурі -->
        <div v-if="crops.length" class="flex flex-wrap gap-2 mb-4">
          <NuxtLink
            v-for="crop in crops"
            :key="crop.id"
            :to="`/dashboard/ai-chat?farmId=${route.params.id}&cropId=${crop.id}&cropType=${encodeURIComponent(crop.crop_type)}${crop.variety ? '&variety=' + encodeURIComponent(crop.variety) : ''}`"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-agro-border text-xs font-semibold text-agro-dark hover:bg-agro-hover transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/>
              <path d="M19 17l.9 2.1L22 20l-2.1.9L19 23l-.9-2.1L16 20l2.1-.9L19 17z"/>
            </svg>
            {{ crop.crop_type }}{{ crop.variety ? ` · ${crop.variety}` : '' }}
          </NuxtLink>
        </div>

        <div v-if="aiChatsLoading" class="space-y-2 mt-3">
          <div v-for="i in 3" :key="i" class="h-14 bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
        <div v-else-if="aiChats.length === 0" class="farm-empty-text">Ще не було консультацій по цьому полю</div>
        <div v-else class="divide-y divide-agro-border mt-1">
          <NuxtLink
            v-for="chat in aiChats"
            :key="chat.id"
            :to="`/dashboard/ai-chat?farmId=${route.params.id}&chatId=${chat.id}`"
            class="flex items-start gap-3 py-3 hover:bg-agro-hover rounded-xl px-2 -mx-2 transition-colors"
          >
            <div class="w-8 h-8 rounded-full bg-agro-hover flex items-center justify-center shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-agro-dark truncate">{{ chat.title }}</p>
              <p class="text-xs text-agro-light truncate mt-0.5">{{ chat.preview }}</p>
            </div>
            <span class="text-xs text-agro-light shrink-0 mt-0.5">{{ chat.date }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Доступ агрономів (тільки для власника) -->
      <div v-if="!readOnly" class="farm-card">
        <div class="farm-section-header">
          <div class="flex items-center gap-2.5">
            <div class="farm-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(47,82,51)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/>
              </svg>
            </div>
            <h2 class="farm-section-title bitter">Агрономи</h2>
          </div>
          <NuxtLink to="/agronomists" class="farm-outline-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Знайти
          </NuxtLink>
        </div>

        <div v-if="activeAgronomists.length === 0" class="farm-empty-text">
          Немає активних угод з агрономами
        </div>

        <div v-else class="space-y-2">
          <div v-for="agr in activeAgronomists" :key="agr.id" class="flex items-center justify-between p-3 bg-agro-bg rounded-xl">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-agro-hover flex items-center justify-center font-bold text-agro text-sm">
                {{ agr.name?.[0]?.toUpperCase() || '?' }}
              </div>
              <div>
                <p class="font-medium text-agro-dark text-sm">{{ agr.name }}</p>
                <p class="text-xs text-agro">✓ Активна угода</p>
              </div>
            </div>
            <NuxtLink :to="`/agronomist/${agr.id}`" class="text-xs text-agro hover:underline font-medium">Профіль →</NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Paywall модалка -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPaywall" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showPaywall = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-8 text-center">
            <div class="text-5xl mb-4">💎</div>
            <h2 class="font-extrabold text-agro-dark text-xl mb-2">Потрібен PRO план</h2>
            <p class="text-agro-light text-sm mb-6">На безкоштовному плані доступна лише <strong>1 культура</strong> на поле. Оновіть до PRO для необмеженого доступу.</p>
            <div class="space-y-3">
              <NuxtLink to="/dashboard/subscription" class="btn-primary w-full block">Оновити до PRO</NuxtLink>
              <button @click="showPaywall = false" class="btn-outline w-full">Залишитись на Basic</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модалка додавання культури -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddCrop" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAddCrop = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-8">
            <h2 class="font-bold text-agro-dark text-xl mb-5">➕ Нова культура</h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Культура</label>
                <div class="relative">
                  <input
                    v-model="cropSearch"
                    @input="searchCrops"
                    @focus="showCropSuggestions = true"
                    @blur="setTimeout(() => showCropSuggestions = false, 200)"
                    class="input"
                    :class="selectedCrop ? 'border-agro' : ''"
                    placeholder="Почніть вводити назву..."
                  />
                  <div v-if="showCropSuggestions && cropResults.length" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                    <button
                      v-for="c in cropResults" :key="c.id"
                      @mousedown.prevent="selectCrop(c)"
                      class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover border-b border-agro-border last:border-0 flex items-center gap-2"
                    >
                      <img :src="`/crops/${cropToSlug(c.name)}.svg`" :alt="c.name" class="w-4 h-4 object-contain" @error="($event.target as HTMLImageElement).style.display='none'" />
                      <span class="font-medium text-agro-dark">{{ c.name }}</span>
                    </button>
                  </div>
                </div>
                <p v-if="selectedCrop" class="text-xs text-agro mt-1 font-medium">✅ {{ selectedCrop.name }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Сорт (необов'язково)</label>
                <div class="relative">
                  <input v-model="newVariety" @input="searchVarieties" @focus="loadVarieties" @blur="setTimeout(() => showVarietySuggestions = false, 200)"
                    class="input" placeholder="Введіть або оберіть сорт..." />
                  <div v-if="showVarietySuggestions" class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-10 overflow-hidden">
                    <button v-for="v in varietySuggestions" :key="v" @mousedown.prevent="newVariety = v; showVarietySuggestions = false"
                      class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover border-b border-agro-border last:border-0">{{ v }}</button>
                    <button v-if="newVariety.trim() && !varietySuggestions.find(v => v.toLowerCase() === newVariety.trim().toLowerCase())"
                      @mousedown.prevent="showVarietySuggestions = false"
                      class="w-full text-left px-4 py-2.5 text-sm text-agro-light hover:bg-agro-hover">
                      ➕ "{{ newVariety }}" — новий сорт, збережеться в базі
                    </button>
                    <div v-if="!varietySuggestions.length && !newVariety.trim()" class="px-4 py-3 text-sm text-agro-light text-center">
                      Немає сортів — введіть свій
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Площа (га)</label>
                <input v-model="newArea" class="input" placeholder="0.0" inputmode="decimal" @input="newArea = ($event.target as HTMLInputElement).value.replace(',', '.')" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Плановий урожай (т/га) <span class="text-agro-light font-normal">(необов'язково)</span></label>
                <input v-model="newPlannedYield" class="input" placeholder="0.0" inputmode="decimal" @input="newPlannedYield = ($event.target as HTMLInputElement).value.replace(',', '.')" />
              </div>
              <label class="flex items-start gap-3 cursor-pointer select-none pt-1">
                <input type="checkbox" v-model="newShowInCatalog" class="mt-0.5 w-4 h-4 accent-agro rounded" />
                <div>
                  <p class="text-sm font-medium text-agro-dark">Показувати у каталозі фермерів</p>
                  <p class="text-xs text-agro-light mt-0.5">Інші користувачі побачать цю культуру у вашому профілі</p>
                </div>
              </label>
            </div>

            <div class="flex gap-3 mt-6">
              <button @click="showAddCrop = false; selectedCrop = null; newVariety = ''; newArea = ''; newPlannedYield = ''; newShowInCatalog = true" class="btn-outline flex-1">Скасувати</button>
              <button @click="addCrop" :disabled="!selectedCrop || saving" class="btn-primary flex-1 inline-flex items-center justify-center gap-1.5">
                <svg v-if="!saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                {{ saving ? '...' : 'Додати' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модалка сівозміни -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddRotation" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeRotationModal" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-8">
            <h2 class="font-bold text-agro-dark text-xl mb-5">{{ rotationForm.id ? '✏️ Редагувати запис' : '➕ Новий запис сівозміни' }}</h2>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-agro-dark mb-1.5">Рік</label>
                  <input v-model="rotationForm.year" type="number" class="input" :placeholder="new Date().getFullYear().toString()" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-agro-dark mb-1.5">Площа (га)</label>
                  <input v-model="rotationForm.area_ha" class="input" placeholder="0.0" inputmode="decimal" @input="rotationForm.area_ha = ($event.target as HTMLInputElement).value.replace(',', '.')" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Культура</label>
                <input v-model="rotationForm.crop_type" class="input" placeholder="Наприклад: Пшениця" />
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Сорт (необов'язково)</label>
                <input v-model="rotationForm.variety" class="input" placeholder="Наприклад: Миронівська 808" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-agro-dark mb-1.5">Плановий врожай (т/га)</label>
                  <input v-model="rotationForm.planned_yield_t" class="input" placeholder="0.0" inputmode="decimal" @input="rotationForm.planned_yield_t = ($event.target as HTMLInputElement).value.replace(',', '.')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-agro-dark mb-1.5">Фактичний врожай (т/га)</label>
                  <input v-model="rotationForm.actual_yield_t" class="input" placeholder="0.0" inputmode="decimal" @input="rotationForm.actual_yield_t = ($event.target as HTMLInputElement).value.replace(',', '.')" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-agro-dark mb-1.5">Примітки</label>
                <textarea v-model="rotationForm.notes" class="input resize-none" rows="2" placeholder="Додаткова інформація..." />
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button @click="closeRotationModal" class="btn-outline flex-1">Скасувати</button>
              <button @click="saveRotation" :disabled="saving" class="btn-primary flex-1">{{ saving ? '...' : 'Зберегти' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модалка редагування культури -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="editingCrop" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="editingCrop = null" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
            <h2 class="font-bold text-agro-dark text-lg mb-4">Редагувати культуру</h2>
            <p class="text-sm font-semibold text-agro-dark mb-4 flex items-center gap-2">
              <img :src="`/crops/${cropToSlug(editingCrop.crop_type)}.svg`" class="w-5 h-5" @error="($event.target as HTMLImageElement).style.display='none'" />
              {{ editingCrop.crop_type }}
            </p>
            <div class="space-y-4">
              <div>
                <label class="farm-edit-label">Сорт</label>
                <div class="relative">
                  <input
                    v-model="editCropForm.variety"
                    class="input"
                    placeholder="Необов'язково"
                    @input="searchEditVarieties"
                    @focus="loadEditVarieties"
                    @blur="setTimeout(() => showEditVarietySuggestions = false, 200)"
                  />
                  <div v-if="showEditVarietySuggestions && (editVarietySuggestions.length || editCropForm.variety.trim())"
                    class="absolute top-full left-0 right-0 mt-1 bg-white border border-agro-border rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto">
                    <button v-for="v in editVarietySuggestions" :key="v" @mousedown.prevent="editCropForm.variety = v; showEditVarietySuggestions = false"
                      class="w-full text-left px-4 py-2.5 text-sm hover:bg-agro-hover transition-colors">{{ v }}</button>
                    <button v-if="editCropForm.variety.trim() && !editVarietySuggestions.find(v => v.toLowerCase() === editCropForm.variety.trim().toLowerCase())"
                      @mousedown.prevent="showEditVarietySuggestions = false"
                      class="w-full text-left px-4 py-2.5 text-sm text-agro hover:bg-agro-hover transition-colors">
                      ➕ "{{ editCropForm.variety }}" — новий сорт
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label class="farm-edit-label">Площа (га)</label>
                <input v-model="editCropForm.area_ha" class="input" type="number" step="0.01" placeholder="0.0" inputmode="decimal" />
              </div>
              <div>
                <label class="farm-edit-label">Планова врожайність (т/га)</label>
                <input v-model="editCropForm.planned_yield_t" class="input" type="number" step="0.01" placeholder="Необов'язково" inputmode="decimal" />
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button @click="editingCrop = null" class="btn-outline flex-1">Скасувати</button>
              <button @click="saveCropEdit" :disabled="saving" class="btn-primary flex-1">{{ saving ? '...' : 'Зберегти' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { Trash2, ShieldCheck } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const farmId = route.params.id as string
const readOnly = route.query.readOnly === '1'
const supabase = useSupabaseClient()


const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const farm = ref<any>(null)

// AI консультації
const aiChats = ref<{ id: string; title: string; preview: string; date: string }[]>([])
const aiChatsLoading = ref(true)

const loadAiChats = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { data: chats } = await supabase
    .from('ai_chats')
    .select('id, created_at, updated_at')
    .eq('user_id', session.user.id)
    .eq('farm_id', route.params.id)
    .order('updated_at', { ascending: false })
    .limit(10)
  if (!chats?.length) { aiChatsLoading.value = false; return }
  const sessions = await Promise.all(chats.map(async (chat: any) => {
    const { data: msgs } = await supabase
      .from('ai_messages').select('role, content, created_at')
      .eq('chat_id', chat.id).order('created_at', { ascending: true })
    if (!msgs?.length) return null
    const firstUser = msgs.find((m: any) => m.role === 'user')
    const lastMsg = msgs[msgs.length - 1]
    const title = firstUser ? firstUser.content.slice(0, 55).replace(/\n/g, ' ') : 'Консультація'
    const preview = (lastMsg?.content || '').replace(/@[\wА-ЯҐЄІЇа-яґєії'-]+/g, (m: string) => m.slice(1)).replace(/SCHEME_DETECTED/g, '').trim().slice(0, 70)
    const d = new Date(chat.updated_at || chat.created_at)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    const date = diffDays === 0 ? 'Сьогодні' : diffDays === 1 ? 'Вчора' : `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
    return { id: chat.id, title, preview, date }
  }))
  aiChats.value = sessions.filter(Boolean) as any[]
  aiChatsLoading.value = false
}

loadAiChats()
const crops = ref<any[]>([])
const activeAgronomists = ref<any[]>([])
const showAddCrop = ref(false)
const showPaywall = ref(false)
const showAddRotation = ref(false)
const rotation = ref<any[]>([])
const rotationForm = reactive({ id: '', year: new Date().getFullYear(), crop_type: '', variety: '', area_ha: '', planned_yield_t: '', actual_yield_t: '', notes: '' })

const editForm = reactive({ name: '', region: '', city: '', hectares: '', cadastral_number: '' })

const { searchSettlements } = useNovaPost()

const UA_AREAS = [
  { name: 'Вінницька область', ref: 'Vinnytsia' }, { name: 'Волинська область', ref: 'Volyn' },
  { name: 'Дніпропетровська область', ref: 'Dnipropetrovsk' }, { name: 'Донецька область', ref: 'Donetsk' },
  { name: 'Житомирська область', ref: 'Zhytomyr' }, { name: 'Закарпатська область', ref: 'Zakarpattia' },
  { name: 'Запорізька область', ref: 'Zaporizhzhia' }, { name: 'Івано-Франківська область', ref: 'Ivano-Frankivsk' },
  { name: 'Київська область', ref: 'Kyiv' }, { name: 'Кіровоградська область', ref: 'Kirovohrad' },
  { name: 'Луганська область', ref: 'Luhansk' }, { name: 'Львівська область', ref: 'Lviv' },
  { name: 'Миколаївська область', ref: 'Mykolaiv' }, { name: 'Одеська область', ref: 'Odesa' },
  { name: 'Полтавська область', ref: 'Poltava' }, { name: 'Рівненська область', ref: 'Rivne' },
  { name: 'Сумська область', ref: 'Sumy' }, { name: 'Тернопільська область', ref: 'Ternopil' },
  { name: 'Харківська область', ref: 'Kharkiv' }, { name: 'Херсонська область', ref: 'Kherson' },
  { name: 'Хмельницька область', ref: 'Khmelnytskyi' }, { name: 'Черкаська область', ref: 'Cherkasy' },
  { name: 'Чернівецька область', ref: 'Chernivtsi' }, { name: 'Чернігівська область', ref: 'Chernihiv' },
  { name: 'м. Київ', ref: 'KyivCity' },
]

const editRegionQuery = ref('')
const showEditRegionList = ref(false)
const editSettlementQuery = ref('')
const editSettlements = ref<any[]>([])
const showEditSettlementList = ref(false)
const loadingEditSettlements = ref(false)
let editSettlementTimer: any = null

const editFilteredAreas = computed(() => {
  const q = editRegionQuery.value.toLowerCase().trim()
  if (!q) return UA_AREAS
  return UA_AREAS.filter(a => a.name.toLowerCase().includes(q))
})

const onEditRegionInput = () => {
  editForm.region = editRegionQuery.value
  editForm.city = ''
  editSettlementQuery.value = ''
  showEditRegionList.value = true
}

const selectEditArea = (area: any) => {
  editRegionQuery.value = area.name
  editForm.region = area.name
  showEditRegionList.value = false
  editSettlementQuery.value = ''
  editForm.city = ''
}

const onEditSettlementInput = () => {
  clearTimeout(editSettlementTimer)
  editForm.city = editSettlementQuery.value
  const q = editSettlementQuery.value.trim()
  if (q.length < 2) { editSettlements.value = []; return }
  loadingEditSettlements.value = true
  editSettlementTimer = setTimeout(async () => {
    editSettlements.value = await searchSettlements(q)
    loadingEditSettlements.value = false
  }, 350)
}

const selectEditSettlement = (s: any) => {
  const name = s.Present.split(',')[0].trim()
  editSettlementQuery.value = s.Present
  editForm.city = name
  editSettlements.value = []
  showEditSettlementList.value = false
}
const selectedCrop = ref<any>(null)
const cropSearch = ref('')
const cropResults = ref<any[]>([])
const showCropSuggestions = ref(false)
let cropSearchTimer: any = null
const newVariety = ref('')
const newArea = ref('')
const newPlannedYield = ref('')
const newShowInCatalog = ref(true)
const varietySuggestions = ref<string[]>([])
const showVarietySuggestions = ref(false)

const { data: { session } } = await supabase.auth.getSession()
const uid = session?.user?.id

const { data: subData } = await supabase.from('subscriptions').select('plan, expires_at').eq('user_id', uid).maybeSingle()
const isPro = subData?.plan === 'pro' && (!subData?.expires_at || new Date(subData.expires_at) > new Date())

const { load: loadCrops, emojiFor } = useCropCatalog()
const { cropToSlug } = await import('~/utils/cropSlugs')

const load = async () => {
  const [farmData, cropsData, rotationData] = await Promise.all([
    supabase.from('farms').select('*').eq('id', farmId).single(),
    supabase.from('farm_crops').select('*').eq('farm_id', farmId).order('created_at'),
    supabase.from('crop_rotation').select('*').eq('farm_id', farmId).order('year', { ascending: false }),
  ])
  rotation.value = rotationData.data || []
  farm.value = farmData.data
  crops.value = cropsData.data || []

  // Агрономи фермера (власника поля) з активними угодами
  if (uid) {
    const { data: agrData } = await supabase.from('agreements')
      .select('agronomist_id').eq('farmer_id', uid).eq('status', 'active')
    const agrIds = (agrData || []).map((a: any) => a.agronomist_id)
    if (agrIds.length) {
      const { data: agrUsers } = await supabase.from('users').select('id, name').in('id', agrIds)
      activeAgronomists.value = agrUsers || []
    } else {
      activeAgronomists.value = []
    }
  }
  loading.value = false
}

await Promise.all([load(), loadCrops()])

const startEdit = () => {
  Object.assign(editForm, { name: farm.value.name, region: farm.value.region || '', city: farm.value.city || '', hectares: String(farm.value.hectares), cadastral_number: farm.value.cadastral_number || '' })
  editRegionQuery.value = farm.value.region || ''
  editSettlementQuery.value = farm.value.city || ''
  editing.value = true
}

const saveFarm = async () => {
  saving.value = true
  await supabase.from('farms').update({ name: editForm.name, region: editForm.region || null, city: editForm.city || null, hectares: parseFloat(editForm.hectares) || 0, cadastral_number: editForm.cadastral_number || null }).eq('id', farmId)
  editing.value = false
  saving.value = false
  await load()
}

const searchCrops = () => {
  clearTimeout(cropSearchTimer)
  cropSearchTimer = setTimeout(async () => {
    const q = cropSearch.value.trim().toLowerCase()
    const { crops } = useCropCatalog()
    cropResults.value = q
      ? crops.value.filter(c => c.name.toLowerCase().includes(q)).slice(0, 20).map(c => ({ name: c.name, emoji: c.emoji }))
      : crops.value.slice(0, 20).map(c => ({ name: c.name, emoji: c.emoji }))
    showCropSuggestions.value = true
  }, 200)
}

const selectCrop = (c: any) => {
  selectedCrop.value = c
  cropSearch.value = c.name
  showCropSuggestions.value = false
}

// Завантажуємо культури одразу при відкритті
watch(showAddCrop, (val) => {
  if (val) {
    const { crops } = useCropCatalog()
    cropResults.value = crops.value.slice(0, 20).map(c => ({ name: c.name, emoji: c.emoji }))
    cropSearch.value = ''
    selectedCrop.value = null
  }
})

const loadVarieties = async () => {
  if (!selectedCrop.value) { showVarietySuggestions.value = false; return }
  const cropName = selectedCrop.value.name
  const { data } = await supabase.from('varieties').select('name')
    .ilike('crop_type', `${cropName}%`)
    .order('name')
  varietySuggestions.value = (data || []).map((v: any) => v.name)
  showVarietySuggestions.value = true
}

let varTimer: any = null
const searchVarieties = () => {
  clearTimeout(varTimer)
  varTimer = setTimeout(async () => {
    if (!selectedCrop.value) return
    const { data } = await supabase.from('varieties').select('name').ilike('crop_type', `${selectedCrop.value.name}%`).ilike('name', `%${newVariety.value}%`).order('name')
    varietySuggestions.value = (data || []).map((v: any) => v.name)
    showVarietySuggestions.value = true
  }, 200)
}

const addCrop = async () => {
  if (!selectedCrop.value) return
  const totalFieldArea = parseFloat(farm.value?.hectares) || 0
  if (!isPro && crops.value.length >= 1) {
    showPaywall.value = true
    return
  }
  const newCropArea = parseFloat(newArea.value) || 0
  if (totalFieldArea > 0) {
    const existingTotal = crops.value.reduce((sum: number, c: any) => sum + (c.area_ha || 0), 0)
    if (existingTotal + newCropArea > totalFieldArea) {
      alert(`⚠️ Сума площ культур (${(existingTotal + newCropArea).toFixed(2)} га) перевищує загальну площу поля (${totalFieldArea} га).`)
      return
    }
  }
  saving.value = true
  if (newVariety.value.trim() && !varietySuggestions.value.includes(newVariety.value.trim())) {
    await supabase.from('varieties').insert({ crop_type: selectedCrop.value.name, name: newVariety.value.trim() })
  }
  await supabase.from('farm_crops').insert({
    farm_id: farmId,
    crop_type: selectedCrop.value.name,
    catalog_id: selectedCrop.value.id,
    variety: newVariety.value.trim() || null,
    area_ha: parseFloat(newArea.value) || 0,
    planned_yield_t: parseFloat(newPlannedYield.value) || null,
    show_in_catalog: newShowInCatalog.value,
  })
  selectedCrop.value = null
  cropSearch.value = ''
  newVariety.value = ''
  newArea.value = ''
  newPlannedYield.value = ''
  newShowInCatalog.value = true
  showAddCrop.value = false
  saving.value = false
  await load()
}

const { confirm: confirmDialog } = useConfirm()

const deleteCrop = async (crop: any) => {
  if (!await confirmDialog(`Культуру "${crop.crop_type}" буде видалено з поля.`, { title: 'Видалити культуру?' })) return
  await supabase.from('farm_crops').delete().eq('id', crop.id)
  await load()
}

const toggleCatalog = async (crop: any) => {
  const newVal = crop.show_in_catalog === false ? true : false
  await supabase.from('farm_crops').update({ show_in_catalog: newVal }).eq('id', crop.id)
  crop.show_in_catalog = newVal
}

const closeRotationModal = () => {
  showAddRotation.value = false
  Object.assign(rotationForm, { id: '', year: new Date().getFullYear(), crop_type: '', variety: '', area_ha: '', planned_yield_t: '', actual_yield_t: '', notes: '' })
}

const editRotationRow = (r: any) => {
  Object.assign(rotationForm, { id: r.id, year: r.year, crop_type: r.crop_type, variety: r.variety || '', area_ha: r.area_ha || '', planned_yield_t: r.planned_yield_t || '', actual_yield_t: r.actual_yield_t || '', notes: r.notes || '' })
  showAddRotation.value = true
}

const saveRotation = async () => {
  if (!rotationForm.crop_type || !rotationForm.year) return
  saving.value = true
  const payload = {
    farm_id: farmId,
    year: Number(rotationForm.year),
    crop_type: rotationForm.crop_type,
    variety: rotationForm.variety || null,
    area_ha: parseFloat(rotationForm.area_ha) || null,
    planned_yield_t: parseFloat(rotationForm.planned_yield_t) || null,
    actual_yield_t: parseFloat(rotationForm.actual_yield_t) || null,
    notes: rotationForm.notes || null,
  }
  if (rotationForm.id) {
    await supabase.from('crop_rotation').update(payload).eq('id', rotationForm.id)
  } else {
    await supabase.from('crop_rotation').insert(payload)
  }
  saving.value = false
  closeRotationModal()
  await load()
}

const deleteRotation = async (id: string) => {
  if (!await confirmDialog('Запис сівозміни буде видалено.', { title: 'Видалити запис?' })) return
  await supabase.from('crop_rotation').delete().eq('id', id)
  await load()
}

// Редагування культури
const editingCrop = ref<any>(null)
const editCropForm = reactive({ variety: '', area_ha: '', planned_yield_t: '' })
const editVarietySuggestions = ref<string[]>([])
const showEditVarietySuggestions = ref(false)

const openEditCrop = (crop: any) => {
  editingCrop.value = crop
  Object.assign(editCropForm, {
    variety: crop.variety || '',
    area_ha: crop.area_ha || '',
    planned_yield_t: crop.planned_yield_t || '',
  })
  editVarietySuggestions.value = []
}

const loadEditVarieties = async () => {
  if (!editingCrop.value) return
  const { data } = await supabase.from('varieties').select('name').ilike('crop_type', `${editingCrop.value.crop_type}%`).order('name')
  editVarietySuggestions.value = (data || []).map((v: any) => v.name)
  showEditVarietySuggestions.value = true
}

const searchEditVarieties = async () => {
  if (!editingCrop.value) return
  const q = editCropForm.variety.trim()
  const { data } = await supabase.from('varieties').select('name').ilike('crop_type', `${editingCrop.value.crop_type}%`).ilike('name', `%${q}%`).order('name')
  editVarietySuggestions.value = (data || []).map((v: any) => v.name)
  showEditVarietySuggestions.value = true
}

const saveCropEdit = async () => {
  if (!editingCrop.value) return
  saving.value = true
  if (editCropForm.variety.trim() && !editVarietySuggestions.value.includes(editCropForm.variety.trim())) {
    await supabase.from('varieties').insert({ crop_type: editingCrop.value.crop_type, name: editCropForm.variety.trim() })
  }
  await supabase.from('farm_crops').update({
    variety: editCropForm.variety.trim() || null,
    area_ha: parseFloat(editCropForm.area_ha) || 0,
    planned_yield_t: parseFloat(editCropForm.planned_yield_t) || null,
  }).eq('id', editingCrop.value.id)
  saving.value = false
  editingCrop.value = null
  await load()
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.bitter { font-family: 'Bitter', Georgia, serif; }

.farm-page {
  padding: 44px 56px;
  font-family: Manrope, sans-serif;
  max-width: 1196px;
}

.farm-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgb(47, 82, 51);
  font-weight: 700;
  font-size: 14.5px;
  line-height: 1;
  text-decoration: none;
  margin-bottom: 28px;
  transition: opacity 0.15s;
}
.farm-back:hover { opacity: 0.75; }

.farm-stack { display: flex; flex-direction: column; gap: 20px; }

.farm-card {
  background: #fff;
  border-radius: 18px;
  padding: 30px 32px;
  box-shadow: 0 8px 28px -18px rgba(30, 45, 25, 0.22);
}

.farm-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.farm-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgb(238, 241, 227);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.farm-title {
  font-size: 22px;
  font-weight: 800;
  color: rgb(27, 46, 27);
  line-height: 1.2;
}

.farm-region {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13.5px;
  color: rgb(107, 122, 100);
  margin-top: 4px;
}

.farm-hectares {
  font-size: 22px;
  font-weight: 800;
  color: rgb(47, 82, 51);
  white-space: nowrap;
  flex-shrink: 0;
}

.farm-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px 32px;
  margin-bottom: 4px;
}

.farm-detail-item { display: flex; flex-direction: column; gap: 4px; }

.farm-detail-label {
  font-size: 11.5px;
  font-weight: 600;
  color: rgb(138, 150, 130);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.farm-detail-value {
  font-size: 15.5px;
  font-weight: 700;
  color: rgb(27, 46, 27);
}

.farm-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 4px;
}

.farm-edit-label {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: rgb(27, 46, 27);
  margin-bottom: 6px;
}

.farm-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  border-radius: 10px;
  border: 1.5px solid rgb(47, 82, 51);
  background: transparent;
  color: rgb(47, 82, 51);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.farm-edit-btn:hover { background: rgb(238, 241, 227); }

.farm-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.farm-section-title {
  font-size: 17px;
  font-weight: 800;
  color: rgb(27, 46, 27);
}

.farm-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 10px;
  background: rgb(47, 82, 51);
  color: rgb(250, 246, 236);
  font-weight: 700;
  font-size: 13.5px;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}
.farm-add-btn:hover { opacity: 0.88; }

.farm-outline-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 10px;
  border: 1.5px solid rgb(47, 82, 51);
  background: transparent;
  color: rgb(47, 82, 51);
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
  transition: background 0.15s;
}
.farm-outline-btn:hover { background: rgb(238, 241, 227); }

.farm-empty-text {
  text-align: center;
  padding: 32px 0;
  font-size: 14.5px;
  color: rgb(107, 122, 100);
}

@media (max-width: 768px) {
  .farm-page { padding: 24px 20px; }
  .farm-detail-grid { grid-template-columns: 1fr; }
  .farm-edit-grid { grid-template-columns: 1fr; }
}
</style>
