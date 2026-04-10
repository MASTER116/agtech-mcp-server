"use client";

import { Wheat, LogOut, User } from "lucide-react";

interface HeaderProps {
  userName?: string;
  orgName?: string;
}

export function Header({ userName = "Пользователь", orgName = "Организация" }: HeaderProps) {
  return (
    <header className="h-16 border-b border-gray-200 border-gray-800 bg-white bg-gray-900 flex items-center justify-between px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Wheat className="h-6 w-6 text-green-600" />
        <span className="font-bold text-gray-900 text-white">AZAT</span>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 text-white">
            {userName}
          </p>
          <p className="text-xs text-gray-500">{orgName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-md hover:bg-gray-100 hover:bg-gray-800">
            <User className="h-4 w-4 text-gray-600" />
          </button>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="p-2 rounded-md hover:bg-gray-100 hover:bg-gray-800"
              title="Выйти"
            >
              <LogOut className="h-4 w-4 text-gray-600" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
