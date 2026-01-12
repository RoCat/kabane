import { GitHubRepository, GitHubUser, KabaneConfig } from '@/types';
import { makeAutoObservable } from 'mobx';

export enum RouteEnum {
  BOARD = 'BOARD',
  TICKET_DETAIL = 'TICKET_DETAIL',
  CREATE_TICKET = 'CREATE_TICKET',
  UPDATE_TICKET = 'UPDATE_TICKET',
}

export const routePatterns = {
  [RouteEnum.BOARD]: /^\/?$/,
  [RouteEnum.TICKET_DETAIL]: /^\/ticket\/(.+)$/,
  [RouteEnum.CREATE_TICKET]: /^\/create-ticket$/,
  [RouteEnum.UPDATE_TICKET]: /^\/update-ticket\/(?<ticketId>.+)$/,
};

export const routes = {
  BOARD: '/',
  TICKET_DETAIL: (id: string) => `/ticket/${id}`,
  CREATE_TICKET: '/create-ticket',
  UPDATE_TICKET: (id: string) => `/update-ticket/${id}`,
};

export class AppMobx {
  loading: boolean = false;

  config: KabaneConfig | null = null;

  isAuthenticated: boolean = false;

  user: GitHubUser | null = null;

  canEdit: boolean = false;

  repository: GitHubRepository | null = null;

  token: string | null = null;

  contributors: GitHubUser[] = [];

  public currentRoute: RouteEnum = RouteEnum.BOARD;

  public previousRoute: RouteEnum = RouteEnum.BOARD;

  constructor() {
    makeAutoObservable(this, {});

    // Listen for browser navigation (back/forward buttons)
    window.addEventListener('popstate', () => {
      this.parseRoute();
    });
  }

  setIsAuthenticated(isAuthenticated: AppMobx['isAuthenticated']) {
    this.isAuthenticated = isAuthenticated;
  }

  setUser(user: AppMobx['user']) {
    this.user = user;
  }

  setCanEdit(canEdit: AppMobx['canEdit']) {
    this.canEdit = canEdit;
  }

  setRepository(repository: AppMobx['repository']) {
    this.repository = repository;
  }

  setToken(token: AppMobx['token']) {
    this.token = token;
  }

  setContributors(contributors: GitHubUser[]) {
    this.contributors = contributors;
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setConfig(config: KabaneConfig | null) {
    this.config = config;
  }

  /**
   * Navigate to a route and update URL
   */
  public navigateTo(path: string, replace = false) {
    const newUrl = `${window.location.pathname}${window.location.search}#${path}`;
    if (replace) {
      window.history.replaceState(null, '', newUrl);
    } else {
      window.history.pushState(null, '', newUrl);
    }
    this.previousRoute = this.currentRoute;
    this.parseRoute();
  }

  /**
   * Parse the current URL hash and return route info
   */
  public parseRoute(): void {
    const hash = window.location.hash.slice(1); // Remove the #
    // use routePatterns to match the hash against defined routes
    for (const [route, pattern] of Object.entries(routePatterns)) {
      if (pattern.test(hash)) {
        this.currentRoute = route as RouteEnum;
        return;
      }
    }
    this.currentRoute = RouteEnum.BOARD; // Default to board for unknown routes
  }
}

export const appMobx = new AppMobx();
(window as any).appMobx = appMobx; // Expose for debugging
