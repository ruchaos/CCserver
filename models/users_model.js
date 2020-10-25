/**
 * Created by Administrator on 2019/8/7.
 */
var mongoose= require('mongoose');
Schema=mongoose.Schema;
var UserSchema=new Schema({
    username:{
        type:String,
        unique:true,
        required:[true, '缺少用户名'],
        validate:{
            validator: function(v) {
                return /^[A-Za-z0-9]{4,10}$/.test(v);
            },
            message: ' 用户名格式错误 '
        }
    },
    password:{
        type:String,
        required:[true, '缺少密码'],
        validate:{
            validator: function(v) {
                return /^[\u0021-\u007E]{6,18}$/.test(v);
            },
            message: ' 密码格式错误 6-18位，英文、数字、符号 '
        }
    },
    cluename:{
        type:String,
        required:[true, '缺少提示信息'],
        validate:{
            validator: function(v) {
                return /^^[\u4e00-\u9fa5\u0021-\u007E]{1,18}$/.test(v);
            },
            message: ' 不能使用空格或为空 '
        }
    }
});
exports.UserSchema=UserSchema;