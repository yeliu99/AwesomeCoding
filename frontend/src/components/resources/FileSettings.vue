<template>
    <el-container>
        <el-main>
            <h5>
                操作说明: <br/>
                所有文件可在个人页进行管理（鼠标移至右上角用户头像->用户资料->我的资源） <br/>
                上传完文件后，需要在"添加到课程"标签栏中将文件添加到课程之中
            </h5>
            <el-menu :default-active="activeIndex" mode="horizontal">
                <el-menu-item index="1" @click="handlePageAdd()">添加到课程</el-menu-item>
                <el-menu-item index="2" @click="handlePageDelete()">从课程删除</el-menu-item>
                <el-menu-item index="3" @click="handlePageUpload()">上传文件</el-menu-item>
            </el-menu>
            <el-table :data="tableData" style="width: 100%" v-if="upload===false">
                <el-table-column prop="showFilename" label="文件名" width="180"></el-table-column>
                <el-table-column align="center" label="操作">
                    <template slot-scope="scope">
                        <el-tooltip v-if="page===true" effect="dark" content="将此文件加入到课程" placement="top-start">
                            <el-button icon="el-icon-check" circle
                                       @click="handleAdd(scope.row)">
                            </el-button>
                        </el-tooltip>
                        <el-tooltip v-else="page===false" class="item" effect="dark" content="将此文件从课程中删除（若需要彻底删除请前往个人页面）" placement="top-start">
                            <el-button icon="el-icon-delete" circle
                                       @click="handleDelete(scope.row)">
                            </el-button>
                        </el-tooltip>
                        <el-tooltip effect="dark" content="将幻灯片作为课件显示在在线授课页面（仅支持pdf格式）" placement="top-start">
                            <el-button icon="el-icon-view" circle
                                       @click="handleView(scope.row)">
                            </el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>

            </el-table>
            <el-upload
                class="upload-demo"
                drag
                action="/api/file/upload"
                v-if="upload===true"
                multiple>
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em>  </div>
            </el-upload>
        </el-main>
    </el-container>
</template>

<script>

    export default {
        data () {
            return {
                tableData: [],
                class_id: "undefined",
                inputData: {
                    userId: undefined,
                    classId: undefined,
                },
                page: true,
                activeIndex: "1",
                upload: false
            };
        },
        mounted: function () {
            this.class_id = this.$route.params.class_id;
            this.inputData.classId = this.class_id;

            this.loadTableData(true);
        },
        methods: {
            loadTableData: function (page) {
                this.$http.post('/api/file/fetch', {}).
                     then(function (lres) {
                         this.$http.post('/api/file/fetch_coursefiles', {classid: this.class_id,}).
                              then(function (fres) {
                                  this.page = page;
                                  this.tableData = [];
                                  for (let i = 0; i < lres.body.results.length; i++) {
                                      let tag = 0;
                                      for (let j = 0; j < fres.body.results.length; j++) {
                                          if (fres.body.results[j].file_id === lres.body.results[i].id) {
                                              tag = 1;
                                              break;
                                          }
                                      }
                                      if (tag === 0 && page === true) {
                                          this.tableData.push(lres.body.results[i]);
                                      } else if (tag === 1 && page === false) {
                                          this.tableData.push(lres.body.results[i]);
                                      }
                                  }
                                  for (let i = 0; i < this.tableData.length; i++) {
                                      this.tableData[i].showFilename = this.tableData[i].filename.slice(32);
                                  }
                              });
                     });
            },
            handleAdd: function (row) {
                this.$http.post('/api/file/add_to_course', {
                    classid: this.inputData.classId,
                    fileid: row.id,
                    filename: row.filename,
                }).
                     then(function (res) {
                         this.loadTableData(true);
                         this.$http.post('/api/class/cache/set',
                             {class_id: this.class_id,
                                 entry:'UPDATE_FILE',
                                 data:true}).
                              then((res) => {});
                     });
            },
            handleDelete: function (row) {
                this.$http.post('/api/file/delete_from_course', {
                    classid: this.inputData.classId,
                    fileid: row.id,
                }).
                     then(function (res) {
                         this.loadTableData(false);
                         this.$http.post('/api/class/cache/set',
                             {class_id: this.class_id,
                                 entry:'UPDATE_FILE',
                                 data:true}).
                              then((res) => {});
                     });
            },

            handlePageAdd: function () {
                this.upload = false;
                this.loadTableData(true);
            },

            handlePageDelete: function () {
                this.upload = false;
                this.loadTableData(false);
            },
            handlePageUpload: function () {
                this.upload = true;
            },

            handleView: function (row) {
                if (row.filename.indexOf("pdf") >= 0) {
                    this.$http.post('/api/class/cache/set',{class_id: this.class_id, entry:'FILE_NAME', data:'/uploads/'+row.filename}).then((res) => {
                        this.$socket.emit('alert', {
                            operation: 'CHANGE_PDF.',
                            pdfSrc: "/uploads/" + row.filename,
                            course_id: this.class_id,
                            echo: true,
                        });
                    });
                } else {
                    alert("请选择pdf文件");
                }
            }
        }
    };
</script>

