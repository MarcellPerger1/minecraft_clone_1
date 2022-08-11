# some magic stuff to make nodejs work
{ pkgs }: { 
  deps = [ 
    # pkgs.nodejs
    pkgs.htop
    pkgs.nodejs-16_x
    pkgs.libuuid 
    pkgs.nodePackages.vscode-langservers-extracted
    pkgs.nodePackages.typescript-language-server
    pkgs.nodePackages.typescript
  ]; 
  env = { 
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [pkgs.libuuid]; 
  }; 
}