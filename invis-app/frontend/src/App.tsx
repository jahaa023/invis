import {BrowserRouter, Routes, Route, Navigate} from "react-router";
import LoginPage from "./pages/LoginPage.tsx";
import MainPage from "./pages/MainPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import HomePage from "./pages/HomePage.tsx";

export default function App() {
    return (
        <BrowserRouter basename="/">
            <Routes>
                <Route index element={<Navigate to={'/home'} />}/>
                <Route path={'/home'} element={<HomePage/>}/>
                <Route path={'/register'} element={<RegisterPage/>}/>
                <Route path={'/login'} element={<LoginPage/>}/>
                <Route path={'/main'} element={<MainPage/>}/>
                <Route path={'*'} element={<Navigate to={'/home'} />}/>
            </Routes>
        </BrowserRouter>
    )
}