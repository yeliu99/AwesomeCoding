<template>
	<div>
		<el-row type='flex' justify='center'>
			<el-col :span='24'>
				<div style='min-height:150px'>
					<div v-if='pdfSrc!=null'>
						<pdf
							id='pdf-frame'
							:page='page'
							:src='pdfSrc'
							@num-pages='handleUploadPages'
							ref='pdf'
							>
						</pdf>
					</div>
					<div v-else>
                        <div v-if="course_role === 0">
                            当前没有可放映课件 <br>
                            可以前往
                            <el-button type="text"
                                       style="display: inline; font-size: 1.0em"
                                       @click="handleJump">
                                资料设置
                            </el-button>
                            页面进行设置
                        </div>
                        <div v-else>
                            当前没有可放映课件
                        </div>
					</div>
				</div>
			</el-col>
		</el-row>
		<el-row type='flex' justify="center">
			<el-tooltip class="item" effect="dark" content="上一页" placement="top-start">
				<div @click='prevPage' class='tag'> <i class="el-icon-arrow-left"></i> </div> </el-tooltip>
			<span class='tag'> 第{{page}}页 / 共{{page_num}}页 </span>
			<el-tooltip class="item" effect="dark" content="下一页" placement="top-start">
				<div @click='nextPage' class='tag'><i class="el-icon-arrow-right"></i></div>
			</el-tooltip>
		</el-row>
	</div>
</template>

<script>
import pdf from 'vue-pdf';
//https://www.npmjs.com/package/vue-pdf

export default {
	data () {
		return {
			page: 1,
			pdfSrc: null,
			page_num: 0,
			class_id: this.$route.params.class_id
		};
	},
    props: { course_role: Number },
	components: {pdf: pdf},
	updated: function () {
		this.pdfSrc = this.pdfSrc;
	},
	mounted: function () {
		this.$http.post('/api/class/cache/get', {class_id: this.class_id, entry: 'FILE_NAME'}).
			then((res) => {
				this.pdfSrc = res.body.results[0].data;
				return this.$http.post('/api/class/cache/get', {class_id: this.class_id, entry: 'PAGE'});
			}).
			then((res) => {
				this.page = +res.body.results[0].data;
			}).
			catch((err) => {
			});
	},
	sockets: {
		alert: function (msg) {
			this.$notify.warning({
				title: '收到通知',
				message: msg.content
			});
			if (msg.operation === 'TURN_PAGE.') {
				this.$notify.warning({
					title: '收到翻页指令',
					message: msg.page
				});
				this.page = msg.page;
			} else if (msg.operation === 'CHANGE_PDF.') {
				this.$notify.warning({
					title: '收到更换文件指令',
					message: msg.pdfSrc
				});
				this.pdfSrc = msg.pdfSrc;
			}
		}
	},
	methods: {
		reload: function () {
		},
		handleUploadPages (event) {
			this.page_num = event;
		},
		nextPage: function () {
			if (this.page + 1 <= this.page_num) {
				this.page += 1;
				this.$http.post('/api/class/cache/set',{class_id: this.class_id, entry:'PAGE', data:''+this.page}).then((res) => {
					this.$socket.emit('alert', {
						operation: 'TURN_PAGE.',
						page: +this.page,
						course_id: this.class_id
					});
				});
			} else {
			}
		},
		prevPage: function () {
			if (this.page - 1 > 0) {
				this.page -= 1;
				this.$http.post('/api/class/cache/set',{class_id: this.class_id, entry:'PAGE', data:''+this.page}).then((res) => {
					this.$socket.emit('alert', {
						operation: 'TURN_PAGE.',
						page: +this.page,
						course_id: this.class_id
					});
				});
			}
		},
        handleJump() {      // 跳到资料设置界面
            this.$router.push(`/class/${this.class_id}/file_settings`);
            this.$emit('jump', 'file_settings');    // 通知父级跳页面
        }
	}
};
</script>

<style scoped>
.tag {
	height:10px;text-align:center;margin-top:8px;padding:5px;
}
#pdf-frame {
	border: 2px solid #d3d4e2;
	width: 100%;
}

.annotationLayer {
	display: none;
}

.page-panel {
	margin: auto;
}

.margin-auto {
	margin: auto;
}
</style>
