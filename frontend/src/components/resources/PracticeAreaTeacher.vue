<template>
    <div v-loading='loading'>
        <el-row :gutter='20'>
            <el-col :span='24'>
                <el-table
                    :data="problemData"
                    style="width: 100%"
                    :row-class-name="tableRowClassName">
                    <el-table-column
                        prop="index"
                        label="编号"
                        width="60">
                    </el-table-column>
                    <el-table-column
                        prop="title"
                        label="题目"
                        width="200">
                    </el-table-column>
                    <el-table-column
                        prop="type_title"
                        label="类型"
                        width='80'
                    >
                    </el-table-column>
                    <el-table-column label="操作">
                        <template slot-scope="scope">
                            <el-tooltip effect="dark" content="编辑题目名称及选项" placement="top-start">
                                <el-button
                                    size="mini"
                                    @click="handleEdit(scope.$index, scope.row)"
                                    :disabled='scope.row.state === 1'
                                >编辑</el-button>
                            </el-tooltip>
                            <el-tooltip effect="dark" content="编辑题目描述" placement="top-start">
                                <el-button
                                    size="mini"
                                    @click='handleContentEditByPID(scope.row,"description")'
                                    :disabled='scope.row.state === 1'
                                >描述</el-button>
                            </el-tooltip>
                            <el-tooltip effect="dark" content="设置标准答案" placement="top-start">
                                <el-button
                                    size="mini"
                                    @click="handlePreview(scope.$index, scope.row)">答案</el-button>
                            </el-tooltip>
                            <el-tooltip effect="dark" content="统计学生答题结果" placement="top-start">
                                <el-button
                                    size="mini"
                                    @click="handleAnalyze(scope.$index, scope.row)">统计</el-button>
                            </el-tooltip>
                            <el-tooltip v-if='scope.row.state===0'effect="dark" content="发布题目，学生可开始答题" placement="top-start">
                                <el-button
                                    v-if='scope.row.state===0'
                                    size='mini'
                                    @click="handlePublish(scope.$index, scope.row, 1)">发布</el-button>
                            </el-tooltip>
                            <el-tooltip v-if='scope.row.state===1 || scope.row.state===2'effect="dark" content="重置题目，将学生已提交的答案清零" placement="top-start">
                                <el-button
                                    v-if='scope.row.state===1 || scope.row.state===2'
                                    size='mini'
                                    @click="handlePublish(scope.$index, scope.row, 0)">重置</el-button>
                            </el-tooltip>
                            <el-tooltip effect="dark" content="结束提问，学生将无法回答题目或修改答案" placement="top-start">
                                <el-button
                                    size='mini'
                                    @click="handlePublish(scope.$inedx, scope.row, 2)"
                                    :disabled='scope.row.state !== 1'
                                >结束</el-button>
                            </el-tooltip>
                            <el-tooltip effect="dark" content="将题目从练习区中删除" placement="top-start">
                                <el-button
                                    size="mini"
                                    type="danger"
                                    @click="handleDelete(scope.row)">删除</el-button>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                </el-table>
            </el-col>
        </el-row>
        <el-row>
            <el-button @click='handleCreate(0)'> 新建选择题 </el-button>
            <el-button @click='handleCreate(1)'> 新建程序题 </el-button>
        </el-row>
        <ChoiceProblemDialog ref='dialog_choice' @completed='handleChoiceDialogCompleted'> </ChoiceProblemDialog>
        <ProgramProblemDialog ref='dialog_program' @completed='handleProgramDialogCompleted'> </ProgramProblemDialog>
        <ContentEditor ref='content_editor'> </ContentEditor>
        <Preview ref='prob_preview'> </Preview>
        <Analyze ref='prob_analyze'> </Analyze>
    </div>
</template>

<script>
    import ContentEditor from '@/components/components/ContentEditor.vue';
    import ChoiceProblemDialog from '@/components/resources/dialogs/ChoiceProblem.vue';
    import ProgramProblemDialog from '@/components/resources/dialogs/ProgramProblem.vue';
    import Preview from '@/components/resources/dialogs/Preview.vue';
    import Analyze from '@/components/resources/dialogs/Analyze.vue';

    export default {
        data: function () {
            return {
                loading: false,
                class_id: this.$route.params.class_id,
                problemData: []
            };
        },
        props: ['course_status'],
        mounted: function () {
            this.reload();
        },
        computed: {},
        methods: {
            reload: function() {
                this.$http.post('/api/problem/list',{class_id: this.class_id, type:'teacher'}).
                     then(function (res) {
						 this.problemData = res.body.results.sort((a,b)=>{return a.time<b.time?-1:a.time>b.time?1:0});
                         this.problemData.forEach(function (item, index) {
                             item.index = index+1;
                             if (item.type == 0) {
                                 item.type_title = '选择题';
                             }
                             if (item.type == 1) {
                                 item.type_title = '程序题';
                             }
                         });
                     }).
                     catch(function (err) {
                         this.$message(err);
                     });
            },
            tableRowClassName: function ({row, rowIndex}) {
                if (row.state === 1)
                    return 'published';
                else if (row.state === 2)
                    return 'ended';
                return '';
            },
            handlePublish: function (idx, row, st) {
                this.$http.post('/api/problem/state/set', {state: st, code: row.code}).
                     then((res) => {
                         return this.$http.post('/api/class/cache/set',{
                             class_id: this.class_id,
                             entry: 'PROBLEM',
                             data: JSON.stringify({
                                 code: row.code,
                                 type: row.type
                             })
                         });
                     }).
                     then((res) => {
                         if (st === 1) {
                             this.$socket.emit('alert',{
                                 operation: 'PROBLEM_PUBLISH.',
                                 course_id: this.class_id,
                                 problem_code: row.code,
                                 info: {type:row.type, code:row.code},
                                 echo: true,
                             });
                         }
                         this.$socket.emit('alert',{
                             operation: 'REFRESH.',
                             course_id: this.class_id,
                             target: 'train_area',
                             echo: true,
                         });
                         this.$message("题目已经发布!");
                         this.reload();
                     }).
                     catch((err) => {
                     });
            },
            handleDelete: function (row) {
                this.$http.post('/api/problem/delete', {code: row.code}).
                     then((res) => {
                         window.location.href = window.location.href;
                     }).
                     catch((err) => {
                     });
            },
            handleAnalyze: function (idx, row) {
                this.$refs.prob_analyze.handleOpen(row);
            },
            handleChoiceDialogCompleted: function (obj) {
                this.problemData[obj.index].title = obj.title;
                this.$http.post('/api/problem/save',{
                    code: obj.info.code,
                    state: obj.state,
                    title: obj.title
                }).
                     then((res) => {}).
                     catch((err) => {});
            },
            handleProgramDialogCompleted: function (obj) {
                this.problemData[obj.index].title = obj.title;
                this.$http.post('/api/problem/save',{
                    code: obj.code,
                    state: obj.state,
                    title: obj.title
                }).
                     then((res) => {}).
                     catch((err) => {});
            },
            handleContentEditByPID: function (info,field) {
                let ptype = undefined;
                if (info.type == 0) {
                    ptype = 'choice_problems';
                } else if (info.type == 1) {
                    ptype = 'program_problems';
                } else {
                }
                this.$http.post('/api/problem/table/'+ptype+'/get',{code: info.code}).
                     then((res) => {
                         let content_id = res.body.results[0][field];
                         this.$refs.content_editor.handleOpen(content_id);
                     }).
                     catch((err) => {
						 console.log(err);
                         this.$message("未知错误");
                     });
            },
            handleCreate: function (ptype) {
                this.loading = true;
                this.$http.post('/api/problem/create',{class_id: this.class_id, type: ptype}).
                     then((res) => {
                         return this.$http.post('/api/problem/list', {class_id: this.class_id, type:'teacher'});
                     }).
                     then((res) => {
						 this.problemData = res.body.results.sort((a,b)=>{return a.time<b.time?-1:a.time>b.time?1:0});
                         this.problemData.forEach(function (item, index) {
                             item.index = index+1;
                             if (item.type == 0) {
                                 item.type_title = '选择题';
                             }
                             if (item.type == 1) {
                                 item.type_title = '程序题';
                             }
                         });
                         this.loading = false;
                     }).
                     catch((err) => {
                         this.loading = false;
                     });
            },
            handleEdit: function (idx, row) {
                let dialog_id = null;
                if (row.type == 0) {
                    dialog_id = 'dialog_choice';
                }
                if (row.type == 1) {
                    dialog_id = 'dialog_program';
                }
                this.$refs[dialog_id].handleOpen(idx,row);
            },
            handlePreview: function (idx, row) {
                this.$refs.prob_preview.handleOpen(row);
            },
        },
        components : {
            ChoiceProblemDialog: ChoiceProblemDialog,
            ProgramProblemDialog: ProgramProblemDialog,
            ContentEditor: ContentEditor,
            Preview: Preview,
            Analyze: Analyze,
        },
    };
</script>

<style>
    .el-table .published {
        background-color:#f0f9eb;
    }
    .el-table .ended {
        background-color:oldlace;
    }
    .correct-answer-button {
    }

    .analyze-button {
    }

    .submit-area {
        display: none;
    }
</style>
