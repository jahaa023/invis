import { NavLink, Outlet, Navigate } from "react-router-dom";

export default function MainLayout() {
  const isLoggedIn = true;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="h-fit w-screen p-3 bg-text-black border-b-2 border-gray-500 flex items-center gap-2.5">
        <NavLink
          to={"/chats"}
          className={({ isActive }) =>
            isActive
              ? 'px-3 py-1.5 font-medium rounded-md cursor-pointer bg-white !text-text-black !no-underline'
              : 'px-3 py-1.5 font-medium !text-text-light rounded-md bg-bg-header-button cursor-pointer hover:bg-bg-header-button-hover hover:text-text-black !no-underline'
          }
          >
          Chats
        </NavLink>
        <NavLink
          to={"/friends_list"}
          className={({ isActive }) =>
            isActive
              ? 'px-3 py-1.5 font-medium rounded-md cursor-pointer bg-white !text-text-black !no-underline'
              : 'px-3 py-1.5 font-medium !text-text-light rounded-md bg-bg-header-button cursor-pointer hover:bg-bg-header-button-hover hover:text-text-black !no-underline'
          }
          >
          Friends list
        </NavLink>
        <NavLink
          to={"/settings"}
          className={({ isActive }) =>
            isActive
              ? 'px-3 py-1.5 font-medium rounded-md cursor-pointer bg-white !text-text-black !no-underline'
              : 'px-3 py-1.5 font-medium !text-text-light rounded-md bg-bg-header-button cursor-pointer hover:bg-bg-header-button-hover hover:text-text-black !no-underline'
          }
          >
          Settings
        </NavLink>
        <NavLink
          to={"/help_center"}
          className={({ isActive }) =>
            isActive
              ? 'px-3 py-1.5 font-medium rounded-md cursor-pointer bg-white !text-text-black !no-underline'
              : 'px-3 py-1.5 font-medium !text-text-light rounded-md bg-bg-header-button cursor-pointer hover:bg-bg-header-button-hover hover:text-text-black !no-underline'
          }
          >
          Help Center
        </NavLink>
      </header>
      <div className="h-full overflow-x-scroll scroll-auto">
        <Outlet />
      </div>
    </div>
  );
}
