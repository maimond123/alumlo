declare module 'mixpanel-browser' {
  interface MixpanelConfig {
    api_host?: string;
    app_host?: string;
    autotrack?: boolean;
    cdn?: string;
    cookie_domain?: string;
    cookie_name?: string;
    loaded?: (mixpanel: Mixpanel) => void;
    cross_subdomain_cookie?: boolean;
    persistence?: 'localStorage' | 'cookie';
    persistence_name?: string;
    debug?: boolean;
    disable_cookie?: boolean;
    disable_persistence?: boolean;
    disable_notifications?: boolean;
    ip?: boolean;
    property_blacklist?: string[];
    opt_out_tracking_by_default?: boolean;
    opt_out_persistence_by_default?: boolean;
    opt_out_tracking_persistence_type?: string;
    opt_out_tracking_cookie_prefix?: string;
    secure_cookie?: boolean;
    track_links_timeout?: number;
    track_pageview?: boolean;
    upgrade?: boolean;
    batch_requests?: boolean;
    batch_flush_interval_ms?: number;
    batch_request_timeout_ms?: number;
    batch_size?: number;
    batch_people_properties?: boolean;
    [key: string]: any;
  }

  interface People {
    set(prop: Record<string, any>): void;
    set(prop: string, to: any): void;
    set_once(prop: Record<string, any>): void;
    set_once(prop: string, to: any): void;
    increment(prop: Record<string, number>): void;
    increment(prop: string, by: number): void;
    append(prop: Record<string, any>): void;
    append(prop: string, value: any): void;
    track_charge(amount: number, properties?: Record<string, any>): void;
    union(prop: Record<string, any[]>): void;
    union(prop: string, values: any[]): void;
    unset(prop: string[]): void;
    unset(prop: string): void;
    delete_user(): void;
  }

  interface Mixpanel {
    init(token: string, config?: MixpanelConfig, name?: string): Mixpanel;
    push(item: [string, any]): void;
    disable(events?: string[]): void;
    track(event_name: string, properties?: Record<string, any>): void;
    track_links(query: string, event_name: string, properties?: Record<string, any>): void;
    track_forms(query: string, event_name: string, properties?: Record<string, any>): void;
    time_event(event_name: string): void;
    register(properties: Record<string, any>, days?: number): void;
    register_once(properties: Record<string, any>, default_value?: any, days?: number): void;
    unregister(property: string): void;
    identify(unique_id: string): void;
    alias(alias: string, original?: string): void;
    reset(): void;
    get_distinct_id(): string;
    get_property(property_name: string): any;
    people: People;
    option(key: string, value: any): void;
    set_config(config: MixpanelConfig): void;
    get_config(key: string): any;
  }

  const mixpanel: Mixpanel;
  export = mixpanel;
} 