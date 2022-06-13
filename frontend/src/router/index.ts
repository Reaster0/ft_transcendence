import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import NotFound from '../views/NotFound.vue'
import LoginPage from "../views/LoginPage.vue";
// import UserPage from "../views/UserPage.vue";
import TwoAuth from "../views/TwoAuthPage.vue";
import TheGame from "../views/TheGame.vue";
// import EditUser from "../views/EditUser.vue";
import Chat from "../views/TransChat_group.vue";
import NewRoom from "../views/TransChat_create_room.vue";
import NewRoomPublic from "../views/TransChat_create_room_public.vue";
import NewRoomPrivate from "../views/TransChat_create_room_private.vue";
import NewRoomProtected from "../views/TransChat_create_room_protected.vue";
import MU from "../views/TransChat_manage_users.vue";
import ChangeRoom from "../views/TransChat_change_room.vue";
import { isLogged, getUserInfo } from "../components/FetchFunctions"
import store from "../store/index"
import UserPagev2 from "../views/UserPagev2.vue";


const routes = [
	{
		path: '/',
		name: "Home",
		component: HomePage,
	},
	{
		path: '/login',
		name: "login",
		component: LoginPage,
		beforeEnter: () => {
			return !store.getters.isConnected? true: "/"
		}
	},
	{
		path: '/:catchAll(.*)',
		name: "404",
		component: NotFound,
	},
	{
		path: '/user',
		name: "user",
		component: UserPagev2,
		// component: UserPage,
		beforeEnter: () => {
			return store.getters.isConnected? true: "/login"
		}
	},
	{
		path: '/2auth',
		name: "twoAuth",
		component: TwoAuth,
		beforeEnter: () => {
			return store.getters.isConnected? true: "/login"
		}
	},
	{
		path: '/game',
		name: "TheGame",
		component: TheGame,
		beforeEnter: () => {
			return store.getters.isConnected? true: "/login"
		}
	},
	// {
	// 	path: '/user/edit',
	// 	name: "editUser",
	// 	component: EditUser,
	// 	beforeEnter: () => {
	// 		return store.getters.isConnected? true: "/login"
	// 	}
	// },
	// {
	// 	path: '/chat',
	// 	name: "chat",
	// 	component: TheChat,
	// 	beforeEnter: () => {
	// 		return store.getters.isConnected? true: "/login"
	// 	}
	// },
	{
		path: '/thechat',
		name: "transchatgroup",
		component: Chat,
		beforeEnter: () => {
			return store.getters.isConnected? true: "/login"
		}
	},
	{
		path: '/newroom',
		name: "NewRoom",
		component: NewRoom,
		beforeEnter: () => {
			return store.getters.isConnected? true: "/login"
		}
	},
	{
		path: '/publicroom',
		name: "PublicRoom",
		component: NewRoomPublic,
		beforeEnter: () => {
			return store.getters.isConnected? true: "/login"
		}
	},
	{
		path: '/privateroom',
		name: "PrivateRoom",
		component: NewRoomPrivate,
		beforeEnter: () => {
			return store.getters.isConnected? true: "/login"
		}
	},
	{
		path: '/protectedroom',
		name: "ProtectedRoom",
		component: NewRoomProtected,
		beforeEnter: () => {
			return store.getters.isConnected? true: "/login"
		}
	},
	{
		path: '/roomsettings',
		name: "changeroom",
		component: ChangeRoom,
		beforeEnter: () => {
			return store.getters.isConnected? true: "/login"
		}
	},
	{
		path: '/mu',
		name: "manageusers",
		component: MU,
		beforeEnter: () => {
			return store.getters.isConnected? true: "/login"
		}
	},
]

const router = createRouter({
history: createWebHistory(process.env.BASE_URL),
routes
})


router.beforeEach(async() => {
	store.commit('setConnected', await isLogged())
	if (store.getters.isConnected) {
		store.commit('setUser', await getUserInfo())
	}
})

export default router
