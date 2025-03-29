#include <windows.h>
#include <shlobj.h>
#include <stdio.h>
//x86_64-w64-mingw32-gcc install.c -o install.exe -lole32 -luuid

int main() {
    // Get the path to the current executable (install.exe)
    char path[MAX_PATH];
    GetModuleFileName(NULL, path, MAX_PATH);

    // Extract the directory containing install.exe
    char* lastBackslash = strrchr(path, '\\');
    if (lastBackslash) {
        *lastBackslash = '\0'; // Remove the executable name to get the directory
    }

    // Construct the path to main.exe
    char mainExePath[MAX_PATH];
    snprintf(mainExePath, MAX_PATH, "%s\\main.exe", path);

    // Get the path to the desktop
    char desktopPath[MAX_PATH];
    if (SHGetFolderPath(NULL, CSIDL_DESKTOPDIRECTORY, NULL, 0, desktopPath) != S_OK) {
        printf("Failed to get desktop path.\n");
        return 1;
    }

    // Construct the path for the shortcut
    char shortcutPath[MAX_PATH];
    snprintf(shortcutPath, MAX_PATH, "%s\\main.lnk", desktopPath);

    // Create the shortcut
    HRESULT hres;
    IShellLink* pShellLink = NULL;
    IPersistFile* pPersistFile = NULL;

    // Initialize COM
    CoInitialize(NULL);

    // Create an IShellLink object
    hres = CoCreateInstance(&CLSID_ShellLink, NULL, CLSCTX_INPROC_SERVER, &IID_IShellLink, (void**)&pShellLink);
    if (SUCCEEDED(hres)) {
        // Set the path to main.exe
        pShellLink->lpVtbl->SetPath(pShellLink, mainExePath);

        // Query for IPersistFile to save the shortcut
        hres = pShellLink->lpVtbl->QueryInterface(pShellLink, &IID_IPersistFile, (void**)&pPersistFile);
        if (SUCCEEDED(hres)) {
            // Save the shortcut to the desktop
            WCHAR wszShortcutPath[MAX_PATH];
            MultiByteToWideChar(CP_ACP, 0, shortcutPath, -1, wszShortcutPath, MAX_PATH);
            hres = pPersistFile->lpVtbl->Save(pPersistFile, wszShortcutPath, TRUE);

            // Release the IPersistFile interface
            pPersistFile->lpVtbl->Release(pPersistFile);
        }

        // Release the IShellLink interface
        pShellLink->lpVtbl->Release(pShellLink);
    }

    // Uninitialize COM
    CoUninitialize();

    if (SUCCEEDED(hres)) {
        printf("Shortcut created successfully on the desktop.\n");
    } else {
        printf("Failed to create shortcut.\n");
    }

    return 0;
}