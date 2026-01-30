import * as RBTrap from 'react-bootstrap';

import {
    Modal,
    Dropdown,
    Button as RButton
} from 'react-bootstrap'

const Button = ({
    onClick,
    title="default"
}) => {

    const getVariant = () => {

        if (title === "Sil") {
            return "danger"
        } else if (title === "Vazgeç") {
            return "warning"
        }

        return "primary"
    }

    return (
        <>
            <RButton variant={getVariant()} onClick={onClick}>{title}</RButton>
        </>
    )   
}

export default Button