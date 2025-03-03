(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const MainFooter = () => {
  return `
    <footer class="footer">
      <p>ⓒ NEXTSTEP All Rights reserved.  </p>
    </footer>
  `;
};
const BUTTON_SIZES = {
  lg: 44,
  md: 36,
  sm: 30
};
const Button = (props) => {
  const {
    name,
    size = "md",
    content,
    variant = "primary",
    fullWidth = false
  } = props;
  const _size = BUTTON_SIZES[size];
  const width = fullWidth ? "100%" : "fit-content";
  return `
    <button
      id="${name}"
      class="${variant}"
      style="
        width: ${width};
        height: ${_size}px;
      "
    >
      ${content}
    </button>
  `;
};
const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`스토리지에서 키 [${key}]를 가져오는 중 오류 발생`, error);
      return defaultValue;
    }
  },
  update: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`스토리지에 키 [${key}]를 저장하는 중 오류 발생`, error);
    }
  },
  delete: (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`스토리지에서 키 [${key}]를 삭제하는 중 오류 발생`, error);
    }
  },
  reset: () => {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error(`스토리지를 초기화하는 중 오류 발생`, error);
    }
  }
};
let isInitialized = false;
const eventManager = {};
const handleEvents = (event) => {
  const handlers = eventManager[event.type];
  if (!handlers) return;
  for (const target in handlers) {
    const matchedElement = event.target.closest(target);
    if (matchedElement) {
      handlers[target](event);
      break;
    }
  }
};
const addEvent = (eventType, target, handler) => {
  if (!eventManager[eventType]) {
    eventManager[eventType] = {};
  }
  eventManager[eventType][target] = handler;
};
const initializeEventManager = () => {
  if (isInitialized) return;
  isInitialized = true;
  Object.keys(eventManager).forEach((eventType) => {
    document.body.addEventListener(eventType, handleEvents);
  });
};
const createObserver = (initialValue, options = { enableStorage: false }) => {
  let value = initialValue;
  const observers = /* @__PURE__ */ new Set();
  const subscribe = (observer) => observers.add(observer);
  const unsubscribe = (observer) => observers.delete(observer);
  const notify = () => observers.forEach((observer) => observer(value));
  const get = () => value;
  const set = (newValue) => {
    value = newValue;
    if (options.enableStorage) {
      for (const [key, objectValue] of Object.entries(value)) {
        storage.update(key, objectValue);
      }
    }
    notify();
  };
  return { subscribe, unsubscribe, get, set };
};
const thumbnailStore = createObserver({
  thumbnailId: null,
  thumbnailTitle: "",
  thumbnailSrc: "",
  thumbnailVoteAverage: 0
});
const searchStore = createObserver({
  hasSearchValue: false,
  searchValue: ""
});
const HelperLabel = (props) => {
  const { content } = props;
  return `
    <span style="color: var(--grey-400); font-size: 14px;">${content}</span>
  `;
};
const Label = (props) => {
  const { name, content, required = false } = props;
  return `
    <div style="display: flex; gap: 4px;">
      <label for="${name}" style="color: var(--grey-400); font-size: 14px;">${content}</label>
      ${required ? '<span style="color: var(--primary-color);">*</span>' : ""}
    </div>
  `;
};
const Input = (props) => {
  const { name, label, placeholder, helperText, required, value } = props;
  const _width = "width: 100%; flex: 1;";
  const _placeholder = placeholder ? `placeholder="${placeholder}"` : "";
  const _value = value ? `value="${value}"` : "";
  return `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${label ? Label({ name, content: label, required }) : ""}
      <input
        id=${name}
        name=${name}
        style="${_width} height: 44px; padding: 8px; border: 1px solid var(--color-white); color: var(--color-white); border-radius: 8px; font-size: 16px; background-color: var(--color-bluegray-100);"
        ${_placeholder}
        ${_value}
      />
      ${helperText ? HelperLabel({ content: helperText }) : ""}
    </div>
  `;
};
const searchParams = {
  get: (key) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  },
  set: (key, value, replace = false) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    if (replace) {
      window.history.replaceState({}, "", newUrl);
    } else {
      window.history.pushState({}, "", newUrl);
    }
  }
};
const SearchInput = () => {
  const { searchValue } = searchStore.get();
  return `
    <div
      style="display: flex; flex-direction: row; align-items: center; gap: 8px;"
    >
      <div style="flex-grow: 1;">
        ${Input({
    name: "search",
    placeholder: "검색어를 입력하세요",
    value: searchValue
  })}
      </div>

      ${Button({ name: "movie_search", content: "검색" })}
    </div>
  `;
};
const handleSearch = () => {
  const inputElement = document.querySelector("#search");
  const searchValue = inputElement.value;
  const hasSearchValue = !!searchValue;
  searchParams.set("page", "1");
  searchStore.set({ hasSearchValue, searchValue });
};
addEvent("keydown", "#search", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});
addEvent("click", "#movie_search", () => {
  handleSearch();
});
const SearchHeader = () => {
  return `
    <div style="display: flex; flex-direction: row; align-items: center;">
      <h1 class="logo">
        <img src="${"/js-movie-review/"}assets/logo.png" alt="logo icon" />
      </h1>

      <div style="display: flex; justify-content: center; flex: 1;">
        <div style="width: 50%;">${SearchInput()}</div>
      </div>
    </div>
  `;
};
const ThumbnailHeader = () => {
  const { thumbnailTitle, thumbnailSrc, thumbnailVoteAverage } = thumbnailStore.get();
  const { hasSearchValue } = searchStore.get();
  const rate = thumbnailVoteAverage.toFixed(1);
  const backgroundImage = hasSearchValue ? "none" : thumbnailSrc ? `url('https://image.tmdb.org/t/p/w1280${thumbnailSrc}');` : "";
  const backgroundContainerClass = `background-container${hasSearchValue ? "__close" : ""}`;
  const topRatedMovieClass = `top-rated-movie${hasSearchValue ? "__close" : ""}`;
  return `
    <header id="header-container">
      <div class="${backgroundContainerClass}">
        <div class="overlay" aria-hidden="true" style="background: no-repeat ${backgroundImage} background-size: cover;">
        </div>

        <div class="top-rated-container">
          ${SearchHeader()}
          
          <div class="${topRatedMovieClass}">
            <div class="rate">
              <img
                src="${"/js-movie-review/"}assets/star_empty.png"
                class="star"
              />
              <span class="rate-value">${rate}</span>
            </div>
            <div class="title">${thumbnailTitle}</div>
            ${Button({ name: "movie_detail", content: "자세히 보기" })}
          </div>
        </div>
      </div>
    </header>
  `;
};
const render$2 = () => {
  const oldContainer = document.querySelector("#header-container");
  if (!oldContainer) return;
  const newContainer = document.createElement("div");
  newContainer.id = "header-container";
  newContainer.innerHTML = ThumbnailHeader();
  oldContainer.replaceWith(newContainer);
};
thumbnailStore.subscribe(render$2);
searchStore.subscribe(render$2);
const EmptyMovie = () => {
  return `<div class="empty">
    <h4 style="font-size: 1.4rem; font-weight: 600;">
      조회된 정보가 없습니다.
    </h4>
  </div>`;
};
const ErrorMovie = (props) => {
  const { message } = props;
  return `
    <main id="error-container">
      <section style="min-height: 480px; display:flex; justify-content: center;' align-items: center;">
         <h4 style="font-size: 1.4rem; font-weight: 600;">${message}</h4>
      </section>
    </main>
  `;
};
const Skeleton = (props) => {
  const { width, height } = props;
  const _width = width ? `${width}px` : "100%";
  const _height = height ? `${height}px` : "100%";
  return `
    <div 
      class="skeleton" 
      style="width: ${_width}; height: ${_height};">
    </div>
  `;
};
const Image = (props) => {
  const { src, alt = "", width = 200, height = 200, className } = props;
  return `
    <div class="image-container">
      ${Skeleton({ width, height })}
      <img
        src="${src}"
        alt="${alt}"
        class="${className}"
        style="display: none;"
        onload="this.style.display = 'block'; this.previousElementSibling.remove();"
      />
    </div>
  `;
};
const MovieItem = (props) => {
  const { title, poster_path, vote_average } = props;
  const rate = vote_average.toFixed(1);
  return `
    <div class="item">
    ${Image({ src: `https://image.tmdb.org/t/p/w342${poster_path}`, alt: title, className: "thumbnail", width: 200, height: 300 })}
    
      <div class="item-desc">
        <p class="rate">
          <img
            src="${"/js-movie-review/"}assets/star_empty.png"
            class="star"
          /><span>${rate}</span>
        </p>
        <strong>${title}</strong>
      </div>
    </div>
  `;
};
const NOT_FOUND_ERROR = 22;
const movieApi = (url, options) => {
  const _options = {
    ...options,
    headers: {
      Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1MTcwOWZlYjA2MmU5YTI5ZDc2MTcyNzcxZjc5NGJiZiIsIm5iZiI6MTc0MDgwODQ2OS41NjcwMDAyLCJzdWIiOiI2N2MyYTExNWMyZTYzMzc1NWI2ZGQ1MGUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.wASfBWMj7Ta_QIktxHZ8WHDN7-1TA6EVqxGi91m5quA"}`,
      accept: "application/json"
    }
  };
  const _url = `https://api.themoviedb.org${url}`;
  return fetch(_url, _options);
};
const getPopularMovie = async (params) => {
  const { page } = params;
  try {
    const response = await movieApi(
      `/3/discover/movie?include_adult=false&include_video=false&language=ko&region=kr&sort_by=popularity.desc&page=${page ?? 1}`,
      { method: "GET" }
    );
    const data = await response.json();
    if (!response.ok) {
      if (data.status_code === NOT_FOUND_ERROR) {
        throw new Error("현재 페이지를 찾을 수 없습니다.");
      } else {
        throw new Error(
          data.status_message || "영화 데이터를 불러오는데 실패했습니다."
        );
      }
    }
    return data;
  } catch (error) {
    throw error;
  }
};
const getSearchedMovies = async (params) => {
  const { page, query } = params;
  try {
    const response = await movieApi(
      `/3/search/movie?query=${query}&include_adult=false&language=ko&region=kr&page=${page ?? 1}`,
      { method: "GET" }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};
const updateMovieThumbnail = (response) => {
  if (!(response == null ? void 0 : response.results) || response.results.length === 0) return;
  const {
    title: thumbnailTitle,
    vote_average: thumbnailVoteAverage,
    id: thumbnailId,
    backdrop_path: thumbnailSrc
  } = response.results[0];
  thumbnailStore.set({
    thumbnailId,
    thumbnailTitle,
    thumbnailSrc,
    thumbnailVoteAverage
  });
};
const MAX_PAGE = 500;
const DEFAULT_POPULAR_MOVIES = { results: [] };
const Home = (props = { popularMovies: DEFAULT_POPULAR_MOVIES }) => {
  var _a;
  const { popularMovies, isError, error } = props;
  const currentPage = Number(searchParams.get("page"));
  const isLastPage = currentPage === MAX_PAGE;
  const isEmpty = (popularMovies == null ? void 0 : popularMovies.results.length) === 0;
  if (isError) {
    return ErrorMovie({ message: error });
  }
  return `
    <main id="home-container">
      <section>
        <h2>지금 인기 있는 영화</h2>

        ${isEmpty ? EmptyMovie() : `<ul class="thumbnail-list">
          ${(_a = popularMovies.results) == null ? void 0 : _a.map((movie) => `<li>${MovieItem(movie)}</li>`).join("")}
        </ul>`}
      </section>

      ${!isLastPage && !isEmpty ? Button({
    name: "movie_more_load",
    content: "더 보기",
    size: "lg",
    fullWidth: true
  }) : ""}
    </main>
  `;
};
const render$1 = ({ loader: loader2, isError, error }) => {
  const oldContainer = document.querySelector("#home-container");
  if (!oldContainer) return;
  const newContainer = document.createElement("div");
  newContainer.id = "home-container";
  newContainer.innerHTML = Home({ popularMovies: loader2, isError, error });
  oldContainer.replaceWith(newContainer);
};
const loader = async () => {
  const page = Number(searchParams.get("page")) || 1;
  const { hasSearchValue, searchValue } = searchStore.get();
  if (hasSearchValue) {
    const searchedMovies = await getSearchedMovies({
      page,
      query: searchValue
    });
    render$1({ isError: false, loader: searchedMovies });
    return;
  }
  try {
    const data = await getPopularMovie({ page });
    updateMovieThumbnail(data);
    render$1({ isError: false, loader: data });
  } catch (error) {
    render$1({ isError: true, error: error.message });
  }
};
searchStore.subscribe(loader);
addEvent("click", "#movie_more_load", () => {
  const page = Number(searchParams.get("page")) || 1;
  searchParams.set("page", page + 1);
  loader();
});
loader();
const App = () => {
  initializeEventManager();
  return `
    <div id="wrap">
      ${ThumbnailHeader()}
      <div class="container">${Home()}</div>
      ${MainFooter()}
    </div>
  `;
};
const globalStore = createObserver({});
console.log("npm run dev 명령어를 통해 영화 리뷰 미션을 시작하세요");
console.log(
  "%c _____ ______   ________  ___      ___ ___  _______                \n|\\   _ \\  _   \\|\\   __  \\|\\  \\    /  /|\\  \\|\\  ___ \\               \n\\ \\  \\\\\\__\\ \\  \\ \\  \\|\\  \\ \\  \\  /  / | \\  \\ \\   __/|              \n \\ \\  \\\\|__| \\  \\ \\  \\\\\\  \\ \\  \\/  / / \\ \\  \\ \\  \\_|/__            \n  \\ \\  \\    \\ \\  \\ \\  \\\\\\  \\ \\    / /   \\ \\  \\ \\  \\_|\\ \\           \n   \\ \\__\\    \\ \\__\\ \\_______\\ \\__/ /     \\ \\__\\ \\_______\\          \n    \\|__|     \\|__|\\|_______|\\|__|/       \\|__|\\|_______|          \n                                                                   \n                                                                   \n                                                                   \n ________  _______   ___      ___ ___  _______   ___       __      \n|\\   __  \\|\\  ___ \\ |\\  \\    /  /|\\  \\|\\  ___ \\ |\\  \\     |\\  \\    \n\\ \\  \\|\\  \\ \\   __/|\\ \\  \\  /  / | \\  \\ \\   __/|\\ \\  \\    \\ \\  \\   \n \\ \\   _  _\\ \\  \\_|/_\\ \\  \\/  / / \\ \\  \\ \\  \\_|/_\\ \\  \\  __\\ \\  \\  \n  \\ \\  \\\\  \\\\ \\  \\_|\\ \\ \\    / /   \\ \\  \\ \\  \\_|\\ \\ \\  \\|\\__\\_\\  \\ \n   \\ \\__\\\\ _\\\\ \\_______\\ \\__/ /     \\ \\__\\ \\_______\\ \\____________\\\n    \\|__|\\|__|\\|_______|\\|__|/       \\|__|\\|_______|\\|____________|",
  "color: #d81b60; font-size: 14px; font-weight: bold;"
);
const render = () => {
  const app = document.querySelector("#app");
  if (app) {
    app.innerHTML = App();
  }
};
render();
globalStore.subscribe(render);
