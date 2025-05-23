import {BrowserRouter, Routes, Route, Navigate} from "react-router";
import { AppProvider } from './AppContext';
import { ModalProvider } from './ModalContext';
import LoginPage from "./pages/LoginPage.tsx";
import ChatsPage from "./pages/ChatsPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import HomePage from "./pages/HomePage.tsx";
import FriendsListPage from "./pages/FriendsListPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import AddFriendsPage from "./pages/AddFriendsPage.tsx";
import MainLayout from "./layouts/MainLayout.tsx";
import AuthRoute from './components/AuthRoute.tsx';

export default function App() {
    return (
        <BrowserRouter basename="/">
            <AppProvider>
                <ModalProvider>
                    <Routes>
                        <Route index element={<Navigate to={'/home'} />}/>
                        <Route path={'/home'} element={<HomePage/>}/>
                        <Route path={'/register'} element={<RegisterPage/>}/>
                        <Route path={'/login'} element={<LoginPage/>}/>
                        <Route path="/" element={<MainLayout />}>
                            <Route path={'chats'} element={
                                <AuthRoute>
                                    <ChatsPage/>
                                </AuthRoute>
                            }/>

                            <Route path={'friends_list'} element={
                                <AuthRoute>
                                    <FriendsListPage/>
                                </AuthRoute>
                            }/>

                            <Route path={'settings'} element={
                                <AuthRoute>
                                    <SettingsPage/>
                                </AuthRoute>
                            }/>

                            <Route path={'add_friends'} element={
                                <AuthRoute>
                                    <AddFriendsPage />
                                </AuthRoute>
                            }/>
                        </Route>
                        <Route path={'*'} element={<Navigate to={'/home'} />}/>
                    </Routes>
                </ModalProvider>
            </AppProvider>
        </BrowserRouter>
    )
}