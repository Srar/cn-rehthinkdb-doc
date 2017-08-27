# 安装 RehinkDB

<section class="supported-platforms">
    <section class="platform-category">
        <h2>官方软件包</h2>
        <ul class="platform-buttons">
            <li>
                <a href="https://www.rethinkdb.com/docs/install/ubuntu/">
                    <img src="/DocsPages/images/system-icons/ubuntu.png">
                    <p class="name">Ubuntu</p>
                </a>
            </li>
            <li>
                <a href="https://www.rethinkdb.com/docs/install/osx/">
                    <img src="/DocsPages/images/system-icons/osx.png">
                    <p class="name">macOS</p>
                </a>
            </li>
            <li>
                <a href="https://www.rethinkdb.com/docs/install/centos/">
                    <img src="/DocsPages/images/system-icons/centos.png">
                    <p class="name">CentOS</p>
                </a>
            </li>
            <li>
                <a href="https://www.rethinkdb.com/docs/install/debian/">
                    <img src="/DocsPages/images/system-icons/debian.png">
                    <p class="name">Debian</p>
                </a>
            </li>
            <li>
                <a href="https://www.rethinkdb.com/docs/install/windows/">
                    <img src="/DocsPages/images/system-icons/windows.png">
                    <p class="name">Windows</p>
                </a>
            </li>
        </ul>
    </section>
    <section class="platform-category">
        <h2>社区构建软件包</h2>
        <ul class="platform-buttons">
            <li>
                <a href="https://www.rethinkdb.com/docs/install/arch/arch/">
                    <img src="/DocsPages/images/system-icons/arch.png">
                    <p class="name">Arch Linux</p>
                </a>
            </li>
            <li>
                <a href="https://www.rethinkdb.com/docs/install/opensuse/">
                    <img src="/DocsPages/images/system-icons/opensuse.png">
                    <p class="name">openSUSE</p>
                </a>
            </li>
            <li>
                <a href="https://www.rethinkdb.com/docs/install/fedora/">
                    <img src="/DocsPages/images/system-icons/fedora.png">
                    <p class="name">Fedora</p>
                </a>
            </li>
            <li>
                <a href="https://www.rethinkdb.com/docs/install/mint/">
                    <img src="/DocsPages/images/system-icons/mint.png">
                    <p class="name">Linux Mint</p>
                </a>
            </li>
            <li>
                <a href="https://www.rethinkdb.com/docs/install/raspbian/">
                    <img src="/DocsPages/images/system-icons/raspbian.png">
                    <p class="name">Raspbian</p>
                </a>
            </li>
        </ul>
    </section>
</section>

---

# Docker

RethinkDB官方提供Docker镜像至Docker Hub. 在Docker运行RethinkDB只需以下操作。
```
$ docker run -d -P --name rethink1 rethinkdb
```

---

# 其他平台安装

___源码编译___

如果你的平台不在已构建列表内，那么你可能需要从源码编译安装RethinkDB. 
在大多数Linux下你应该可以编译安装成功. 

[点击这里获取源码编译安装指南.](/#/Docs/install/source)


___历史版本___

你可以从[这里](https://download.rethinkdb.com/)下载历史版本的文件.
