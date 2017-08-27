# 从源码编译安装RethinkDB

## 编译所需要的依赖
* [GCC (G++)](https://gcc.gnu.org/) 或者 [Clang](http://clang.llvm.org/)
* [Protocol Buffers](https://github.com/google/protobuf/)
* [jemalloc](http://www.canonware.com/jemalloc/)
* [Ncurses](https://www.gnu.org/software/ncurses/)
* [Boost](http://www.boost.org/)
* [Python 2](https://www.python.org/)
* [libcurl](http://curl.haxx.se/libcurl/)
* [libcrypto](https://www.openssl.org/)

__CentOS/RedHat依赖安装__

```shell
sudo yum install openssl-devel libcurl-devel wget tar m4 git-core \
                 boost-static m4 gcc-c++ npm ncurses-devel which \
                 make ncurses-static zlib-devel zlib-static

sudo yum install epel-release
sudo yum install protobuf-devel protobuf-static jemalloc-devel
```

__Ubuntu/Debian依赖安装__

```shell
sudo apt-get install build-essential protobuf-compiler python \
                     libprotobuf-dev libcurl4-openssl-dev \
                     libboost-all-dev libncurses5-dev \
                     libjemalloc-dev wget m4
```

## 从Git获取源码编译安装

Git版本包含未发布以及不稳定的修改, 这适用于开发者或项目贡献者使用.

__使用Git clone development分支获取获取源码__

```
git clone https://github.com/rethinkdb/rethinkdb.git
```

__从RethinkDB官方获取最新的Release源码__
```
wget https://download.rethinkdb.com/dist/rethinkdb-2.3.6.tgz
tar xf rethinkdb-2.3.6.tgz
```

__编译RethinkDB__

```
cd rethinkdb
./configure --allow-fetch
make
```

如果您编译机器上是多核CPU, 您可以在`make`命令后添加`-j 线程数`参数来加速编译. 例如您有4核8线程的CPU, 您可以使用`make -j 8`.
在旧版本RethinkDB源码编译使用多线程编译可能会导致编译失败, 此时请不要使用多线程编译.

等待编译结束后您可以在`build/release/`中找到`rethinkdb`可执行二进制文件.