import { Injectable } from "@nestjs/common"
import { AuthService } from "src/auth/auth.service"
import { CategoryService } from "src/category/category.service"
import { CommentService } from "src/comment/comment.service"
import { CommentMetricsService } from "src/comment_metrics/comment_metrics.service"
import { FavoriteCommentService } from "src/favorite_comment/favorite_comment.service"
import { FavoritePostService } from "src/favorite_post/favorite_post.service"
import { LikeService } from "src/like/like.service"
import { LikeCommentService } from "src/like_comment/like_comment.service"
import { PostService } from "src/post/post.service"
import { PostMetricsService } from "src/post_metrics/post_metrics.service"
import { RecoverPasswordService } from "src/recover_password/recover_password.service"
import { UserService } from "src/user/user.service"
import { UserMetricsService } from "src/user_metrics/user_metrics.service"

@Injectable()
export class UnitOfWork {
    constructor(
        public readonly userService: UserService,
        public readonly userMetricService: UserMetricsService,
        public readonly postMetricsService: PostMetricsService,
        public readonly postService: PostService,
        public readonly likeService: LikeService,
        public readonly favoritePostService: FavoritePostService,
        public readonly commentMetricsService: CommentMetricsService,
        public readonly commentService: CommentService,
        public readonly categoryService: CategoryService,
        public readonly authService: AuthService,
        public readonly favoriteCommentService: FavoriteCommentService,
        public readonly likeCommentService: LikeCommentService,
        public readonly recoverPassword: RecoverPasswordService,
    ){}
}