export interface AccountOrderItem {
	id: number;
	name: string;
	quantity: number;
	price: number;
	image: string;
}

export interface AccountOrder {
	id: string;
	placedAt: string;
	status: string;
	total: number;
	shipping: string;
	items: AccountOrderItem[];
}

export interface WishlistItem {
	id: number;
	name: string;
	price: number;
	collection: string;
	image: string;
}

export interface AccountDashboardStats {
	totalOrders: number;
	activeOrders: number;
	wishlistCount: number;
	totalSpent: number;
}

export interface AccountDashboardData {
	orders: AccountOrder[];
	wishlist: WishlistItem[];
	stats: AccountDashboardStats;
}
