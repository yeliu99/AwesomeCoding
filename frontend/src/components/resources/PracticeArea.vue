<template>
	<div>
		<el-card v-for='info in problemData' :key='info.code'>
			<ChoiceProblem v-if='info && info.type === 0' :default_code='info.code' />
			<ProgramProblem v-if='info && info.type === 1' :default_code='info.code' />
		</el-card>
	</div>
</template>

<script>
import ChoiceProblem from '@/components/resources/render/ChoiceProblem.vue';
import ProgramProblem from '@/components/resources/render/ProgramProblem.vue';
export default {
	data: function() {
		return {
			problemData: [],
			class_id: this.$route.params.class_id,
		};
	},
	props: ['course_status'],
	sockets: {
		alert: function (msg) {
			if (msg.operation === 'REFRESH.' && msg.target=='train_area') {
				this.reload();
			}
		},
	},
	mounted: function() {
		this.reload();
	},
	methods: {
		reload: function() {
			this.$http.post('/api/problem/list',{class_id: this.class_id, type:'student'}).
				then(function(res) {
					this.problemData = res.body.results;
					this.problemData.forEach(function (item, index) {
						item.index = index+1; 
						if (item.type === 0) item.type_title = '选择题';
						if (item.type === 1) item.type_title = '编程题';
					});
				}).
				catch(function(err) {
					this.$message(err);
				});
		}
	},
	components: {
		ChoiceProblem: ChoiceProblem,
		ProgramProblem: ProgramProblem
	},
};
</script>

<style>
</style>
