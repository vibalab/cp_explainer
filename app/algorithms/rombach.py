import numpy as np
import numba
from simanneal import Annealer

class Rombach:
    def __init__(self, graph, A, alpha=0.5, beta=0.8):
        self.G = graph
        self.A = A
        self.alpha = alpha
        self.beta = beta

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def transition_function(i, N, alpha, beta):
        """전이 함수 g_{alpha, beta}(i)를 구현합니다."""
        if i <= int(beta * N):
            return i * (1 - alpha) / ((beta * N) * 2)
        else:
            return (((i - beta * N) * (1 - alpha)) / (2 * (N - beta * N))) + ((1 + alpha) / 2)

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def calculate_core_quality(A, C):
        """코어 품질 R_{alpha, beta}를 계산합니다."""
        return np.sum(A * np.outer(C, C))

    def find_optimal_core_vector(self, A, alpha, beta):
        """최적의 코어 벡터 C*를 찾습니다."""
        N = A.shape[0]
        C_star = np.zeros(N)
        for i in range(1, N + 1):
            C_star[i - 1] = self.transition_function(i, N, alpha, beta)
        return C_star

    def aggregate_core_score(self, A, alpha_values, beta_values):
        """각 노드의 코어 점수 CS(i)를 계산합니다."""
        N = A.shape[0]
        core_scores = np.zeros(N)
        Z = 0  # 정규화 인자

        for alpha in alpha_values:
            for beta in beta_values:
                C_star = self.find_optimal_core_vector(A, alpha, beta)
                R_gamma = self.calculate_core_quality(A, C_star)
                core_scores += C_star * R_gamma
                Z = max(Z, np.max(core_scores))

        core_scores /= Z  # 정규화
        return core_scores, R_gamma

    class NodeOrderAnnealer(Annealer):
        def __init__(self, state, A, alpha, beta, step, parent):
            self.A = A
            self.alpha = alpha
            self.beta = beta
            self.parent = parent
            self.steps = step  # 총 단계 수
            self.Tmax = 1  # 초기 온도
            self.Tmin = 1e-8  # 최종 온도
            super().__init__(state)  # 초기 상태 설정

        def default_update(self, step, T, E, acceptance, improvement):
            """Silent update, does not output anything."""
            pass

        def move(self):
            """임의의 두 노드를 스왑하여 이웃 상태를 생성합니다."""
            a = np.random.randint(0, len(self.state))
            b = np.random.randint(0, len(self.state))
            self.state[a], self.state[b] = self.state[b], self.state[a]

        def energy(self):
            """현재 상태의 에너지를 계산합니다 (코어 품질의 음수)."""
            order = self.state
            A_ordered = self.A[order][:, order]
            core_vector = self.parent.find_optimal_core_vector(A_ordered, self.alpha, self.beta)
            core_quality = self.parent.calculate_core_quality(A_ordered, core_vector)
            return -core_quality  # 코어 품질의 음수를 에너지로 사용

    def optimize(self, step):
        # 초기 상태 (노드 순서)
        initial_state = list(np.arange(self.A.shape[0]))

        # Annealer 생성
        annealer = self.NodeOrderAnnealer(initial_state, self.A, self.alpha, self.beta, step, self)

        # 최적화 수행
        best_state, best_energy = annealer.anneal()

        # 결과 적용
        best_order = best_state
        A_optimized = self.A[best_order][:, best_order]
        core_scores_optimized, R_gamma = self.aggregate_core_score(A_optimized, [self.alpha], [self.beta])
        core_nodes = np.where(core_scores_optimized > 0.7)[0]
        result = [best_order[i] for i in core_nodes]

        core_scores_reordered = np.zeros(self.A.shape[0])
        j = 0
        for i in best_order:
            core_scores_reordered[i] = core_scores_optimized[j]
            j += 1

        core_scores_optimized = [core_scores_optimized[i] for i in best_order]

        return best_order, core_scores_reordered, result, R_gamma